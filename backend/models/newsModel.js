const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER },
    status: { 
        type: DataTypes.ENUM('published', 'draft'),
        defaultValue: 'published'
    },
    is_admin_content: { type: DataTypes.BOOLEAN, defaultValue: true },
    youtube_url: { type: DataTypes.STRING },
    image_url: { type: DataTypes.STRING },
    is_highlight: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'news',
    timestamps: false,
});

module.exports = News;
