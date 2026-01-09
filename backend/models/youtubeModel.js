const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const YouTube = sequelize.define('YouTube', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER },
    status: { 
        type: DataTypes.ENUM('published', 'draft'),
        defaultValue: 'published'
    },
    is_admin_content: { type: DataTypes.BOOLEAN, defaultValue: true },
    youtube_url: { type: DataTypes.STRING, allowNull: false },
    thumbnail_url: { type: DataTypes.STRING },
    is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'youtube_videos',
    timestamps: false,
});

module.exports = YouTube;
