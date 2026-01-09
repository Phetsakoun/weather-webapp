const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseMonitoringService {
    
    static async getDatabaseHealth() {
        let connection;
        
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3307,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'weather_db',
                timezone: '+00:00'
            });

            // 1. ขนาดของแต่ละตาราง
            const [tableSizes] = await connection.execute(`
                SELECT 
                    table_name AS table_name,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                    table_rows AS estimated_rows,
                    ROUND((data_length / 1024 / 1024), 2) AS data_mb,
                    ROUND((index_length / 1024 / 1024), 2) AS index_mb,
                    ROUND((data_length / table_rows), 2) AS avg_row_size
                FROM information_schema.tables 
                WHERE table_schema = ?
                ORDER BY (data_length + index_length) DESC
            `, [process.env.DB_NAME || 'weather_db']);

            // 2. สถานะ connection
            const [connections] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
            const [maxConnections] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');

            // 3. การใช้งาน memory
            const [memoryUsage] = await connection.execute(`
                SELECT 
                    FORMAT((SELECT SUM(data_length + index_length) 
                           FROM information_schema.tables 
                           WHERE table_schema = ?), 0) AS total_db_size,
                    FORMAT((SELECT SUM(data_length) 
                           FROM information_schema.tables 
                           WHERE table_schema = ?), 0) AS total_data_size,
                    FORMAT((SELECT SUM(index_length) 
                           FROM information_schema.tables 
                           WHERE table_schema = ?), 0) AS total_index_size
            `, [process.env.DB_NAME, process.env.DB_NAME, process.env.DB_NAME]);

            // 4. ตรวจสอบ slow queries (ถ้า enabled)
            let slowQueries = [];
            try {
                const [slowQueryResult] = await connection.execute('SHOW STATUS LIKE "Slow_queries"');
                slowQueries = slowQueryResult;
            } catch (e) {
                // Slow query log might not be enabled
            }

            // 5. ตรวจสอบสถานะของ weather table โดยเฉพาะ
            const [weatherStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT city_id) as unique_cities,
                    MIN(timestamp) as oldest_record,
                    MAX(timestamp) as newest_record,
                    ROUND(AVG(temperature), 2) as avg_temperature,
                    ROUND(AVG(humidity), 2) as avg_humidity,
                    ROUND(SUM(rainfall), 2) as total_rainfall
                FROM weather
            `);

            // 6. ตรวจสอบ growth rate
            const [growthRate] = await connection.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as records_added
                FROM weather 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

            return {
                timestamp: new Date(),
                database_health: {
                    status: 'healthy',
                    total_tables: tableSizes.length,
                    total_size_mb: tableSizes.reduce((sum, table) => sum + table.size_mb, 0)
                },
                tables: tableSizes,
                connections: {
                    current: connections[0]?.Value || 0,
                    max: maxConnections[0]?.Value || 0
                },
                memory_usage: memoryUsage[0],
                weather_table_stats: weatherStats[0],
                growth_rate: growthRate,
                slow_queries: slowQueries,
                recommendations: this.generateRecommendations(tableSizes, weatherStats[0], growthRate)
            };

        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    static generateRecommendations(tableSizes, weatherStats, growthRate) {
        const recommendations = [];
        const weatherTable = tableSizes.find(t => t.table_name === 'weather');
        
        // ตรวจสอบขนาดตาราง
        if (weatherTable && weatherTable.size_mb > 100) {
            recommendations.push({
                type: 'warning',
                title: 'Large Table Size',
                message: `Weather table is ${weatherTable.size_mb} MB. Consider archiving old data.`,
                action: 'archive_old_data'
            });
        }

        // ตรวจสอบ growth rate
        if (growthRate.length > 0) {
            const avgGrowth = growthRate.reduce((sum, day) => sum + day.records_added, 0) / growthRate.length;
            if (avgGrowth > 1000) {
                recommendations.push({
                    type: 'info',
                    title: 'High Growth Rate',
                    message: `Average ${avgGrowth.toFixed(0)} records added per day. Monitor disk space.`,
                    action: 'monitor_growth'
                });
            }
        }

        // ตรวจสอบ index efficiency
        if (weatherTable && weatherTable.index_mb < weatherTable.data_mb * 0.1) {
            recommendations.push({
                type: 'suggestion',
                title: 'Index Optimization',
                message: 'Consider adding more indexes for better query performance.',
                action: 'add_indexes'
            });
        }

        // ตรวจสอบข้อมูลเก่า
        if (weatherStats.total_records > 10000) {
            const oldestDate = new Date(weatherStats.oldest_record);
            const daysSinceOldest = (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceOldest > 180) {
                recommendations.push({
                    type: 'action_required',
                    title: 'Data Archiving Needed',
                    message: `Data spans ${daysSinceOldest.toFixed(0)} days. Archive data older than 90 days.`,
                    action: 'setup_archiving'
                });
            }
        }

        return recommendations;
    }

    static async getPerformanceMetrics() {
        let connection;
        
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3307,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'weather_db',
                timezone: '+00:00'
            });

            // Test common queries และวัดเวลา
            const metrics = {};

            // Query 1: Latest weather for all cities
            const start1 = Date.now();
            await connection.execute(`
                SELECT w.*, c.name_th 
                FROM weather w 
                LEFT JOIN cities c ON w.city_id = c.id 
                WHERE w.id IN (
                    SELECT MAX(id) FROM weather GROUP BY city_id
                )
            `);
            metrics.latest_all_cities_ms = Date.now() - start1;

            // Query 2: Weather data for last 7 days
            const start2 = Date.now();
            await connection.execute(`
                SELECT * FROM weather 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY timestamp DESC
                LIMIT 100
            `);
            metrics.last_7_days_ms = Date.now() - start2;

            // Query 3: Aggregated daily data
            const start3 = Date.now();
            await connection.execute(`
                SELECT 
                    DATE(timestamp) as date,
                    city_id,
                    AVG(temperature) as avg_temp,
                    COUNT(*) as records
                FROM weather 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(timestamp), city_id
                ORDER BY date DESC
            `);
            metrics.monthly_aggregation_ms = Date.now() - start3;

            return {
                timestamp: new Date(),
                query_performance: metrics,
                performance_status: this.evaluatePerformance(metrics)
            };

        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    static evaluatePerformance(metrics) {
        const issues = [];
        
        if (metrics.latest_all_cities_ms > 100) {
            issues.push('Latest cities query is slow');
        }
        
        if (metrics.last_7_days_ms > 200) {
            issues.push('7-day query is slow');
        }
        
        if (metrics.monthly_aggregation_ms > 500) {
            issues.push('Monthly aggregation is slow');
        }

        if (issues.length === 0) {
            return { status: 'excellent', message: 'All queries performing well' };
        } else if (issues.length <= 1) {
            return { status: 'good', message: 'Minor performance issues', issues };
        } else {
            return { status: 'needs_optimization', message: 'Multiple performance issues', issues };
        }
    }
}

module.exports = DatabaseMonitoringService;
