const Weather = require('../models/weatherModel');
const { Op } = require('sequelize');
const NodeCache = require('node-cache');

// สร้าง cache instance (TTL = 5 นาที)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class WeatherOptimizationService {
    
    // 1. การดึงข้อมูลแบบ pagination
    static async getWeatherWithPagination(options = {}) {
        const {
            page = 1,
            limit = 50,
            city_id = null,
            startDate = null,
            endDate = null,
            orderBy = 'timestamp',
            orderDirection = 'DESC'
        } = options;

        // คำนวณ offset
        const offset = (page - 1) * limit;
        
        // สร้าง where conditions
        const whereConditions = {};
        
        if (city_id) {
            whereConditions.city_id = city_id;
        }
        
        if (startDate && endDate) {
            whereConditions.timestamp = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            whereConditions.timestamp = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            whereConditions.timestamp = {
                [Op.lte]: endDate
            };
        }

        try {
            const result = await Weather.findAndCountAll({
                where: whereConditions,
                order: [[orderBy, orderDirection]],
                limit: parseInt(limit),
                offset: offset,
                attributes: [
                    'id', 'city_id', 'timestamp', 'temperature', 
                    'humidity', 'pressure', 'rainfall', 'wind_speed', 'description'
                ]
            });

            return {
                data: result.rows,
                pagination: {
                    current_page: parseInt(page),
                    per_page: parseInt(limit),
                    total: result.count,
                    total_pages: Math.ceil(result.count / limit),
                    has_next: (page * limit) < result.count,
                    has_prev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error fetching weather data: ${error.message}`);
        }
    }

    // 2. การดึงข้อมูลล่าสุดแบบ cached
    static async getLatestWeatherCached(cityId) {
        const cacheKey = `latest_weather_${cityId}`;
        let cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return { ...cachedData, from_cache: true };
        }

        try {
            const latestWeather = await Weather.findOne({
                where: { city_id: cityId },
                order: [['timestamp', 'DESC']],
                attributes: [
                    'id', 'city_id', 'timestamp', 'temperature', 
                    'humidity', 'pressure', 'rainfall', 'wind_speed', 'description'
                ]
            });

            if (latestWeather) {
                cache.set(cacheKey, latestWeather.toJSON());
                return { ...latestWeather.toJSON(), from_cache: false };
            }
            
            return null;
        } catch (error) {
            throw new Error(`Error fetching latest weather: ${error.message}`);
        }
    }

    // 3. การสร้าง daily summary
    static async createDailySummary(date, cityId = null) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const whereConditions = {
            timestamp: {
                [Op.gte]: targetDate,
                [Op.lt]: nextDate
            }
        };

        if (cityId) {
            whereConditions.city_id = cityId;
        }

        try {
            const summary = await Weather.findAll({
                where: whereConditions,
                attributes: [
                    'city_id',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'record_count'],
                    [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
                    [sequelize.fn('MAX', sequelize.col('temperature')), 'max_temperature'],
                    [sequelize.fn('MIN', sequelize.col('temperature')), 'min_temperature'],
                    [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
                    [sequelize.fn('MAX', sequelize.col('humidity')), 'max_humidity'],
                    [sequelize.fn('MIN', sequelize.col('humidity')), 'min_humidity'],
                    [sequelize.fn('SUM', sequelize.col('rainfall')), 'total_rainfall'],
                    [sequelize.fn('AVG', sequelize.col('pressure')), 'avg_pressure'],
                    [sequelize.fn('AVG', sequelize.col('wind_speed')), 'avg_wind_speed']
                ],
                group: cityId ? [] : ['city_id'],
                raw: true
            });

            return summary;
        } catch (error) {
            throw new Error(`Error creating daily summary: ${error.message}`);
        }
    }

    // 4. การทำความสะอาดข้อมูลเก่า
    static async archiveOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        try {
            // ย้ายข้อมูลเก่าไป archive table
            const oldData = await Weather.findAll({
                where: {
                    timestamp: {
                        [Op.lt]: cutoffDate
                    }
                }
            });

            if (oldData.length > 0) {
                // Insert ไป archive table
                const archiveData = oldData.map(record => ({
                    original_id: record.id,
                    city_id: record.city_id,
                    timestamp: record.timestamp,
                    temperature: record.temperature,
                    humidity: record.humidity,
                    wind_speed: record.wind_speed,
                    rainfall: record.rainfall,
                    pressure: record.pressure,
                    description: record.description
                }));

                await sequelize.models.WeatherArchive.bulkCreate(archiveData);

                // ลบข้อมูลเก่าจากตารางหลัก
                const deletedCount = await Weather.destroy({
                    where: {
                        timestamp: {
                            [Op.lt]: cutoffDate
                        }
                    }
                });

                return {
                    archived_records: oldData.length,
                    deleted_records: deletedCount,
                    cutoff_date: cutoffDate
                };
            }

            return {
                archived_records: 0,
                deleted_records: 0,
                message: 'No old data to archive'
            };

        } catch (error) {
            throw new Error(`Error archiving old data: ${error.message}`);
        }
    }

    // 5. การล้าง cache
    static clearCache(pattern = null) {
        if (pattern) {
            const keys = cache.keys();
            const matchingKeys = keys.filter(key => key.includes(pattern));
            matchingKeys.forEach(key => cache.del(key));
            return { cleared_keys: matchingKeys.length };
        } else {
            cache.flushAll();
            return { message: 'All cache cleared' };
        }
    }

    // 6. สถิติการใช้งาน cache
    static getCacheStats() {
        return {
            keys: cache.keys().length,
            stats: cache.getStats()
        };
    }

    // 7. การตรวจสอบประสิทธิภาพ query
    static async analyzeQueryPerformance(query, params = {}) {
        const startTime = process.hrtime.bigint();
        
        try {
            const result = await sequelize.query(query, {
                replacements: params,
                type: sequelize.QueryTypes.SELECT
            });
            
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

            // บันทึกลง performance log (ถ้าต้องการ)
            if (executionTime > 100) { // บันทึกเฉพาะ query ที่ช้า
                console.warn(`Slow query detected: ${executionTime.toFixed(2)}ms`);
                console.warn(`Query: ${query}`);
            }

            return {
                result,
                execution_time_ms: executionTime,
                is_slow: executionTime > 100
            };

        } catch (error) {
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000;
            
            throw new Error(`Query failed after ${executionTime.toFixed(2)}ms: ${error.message}`);
        }
    }
}

module.exports = WeatherOptimizationService;
