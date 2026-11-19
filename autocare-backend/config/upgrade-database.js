// config/upgrade-database.js — runs every time the server starts (see server.js),
// so the database is always up to date (no extra command needed).
// It only ADDS what is missing, it never deletes data.

const db = require('./db');
const { DEFAULT_SETTINGS } = require('./default-settings');
const { setupSettings } = require('../models/settingsModel');

async function upgradeDatabase() {
  await setupSettings();                       // adds new settings such as vehicleTypes
  // The old general list (power tiller, JCB …) -> the Toyota types, only if the admin never changed it
  await db.query("UPDATE settings SET value = ? WHERE name = 'vehicleTypes' AND value LIKE 'Light vehicle (car, SUV)%Earth-moving machine (excavator, JCB)'",
    [DEFAULT_SETTINGS.vehicleTypes]);
  // The home page label follows the workshop address (only if the admin never changed the label)
  await db.query("UPDATE settings SET value = ? WHERE name = 'homeTag' AND value = 'Auto workshop · Sarpang, Bhutan'",
    [DEFAULT_SETTINGS.homeTag]);
  // Service pictures can now be uploaded (saved as text), so the columns must be bigger
  const [pic] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'image' AND DATA_TYPE <> 'mediumtext'`);
  if (Number(pic[0].n) > 0) {
    await db.query('ALTER TABLE services MODIFY image MEDIUMTEXT NULL, MODIFY gallery MEDIUMTEXT NULL');
  }
  // Inventory (shop) pictures can be uploaded too
  const [invPic] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'image' AND DATA_TYPE <> 'mediumtext'`);
  if (Number(invPic[0].n) > 0) {
    await db.query('ALTER TABLE inventory MODIFY image MEDIUMTEXT NULL');
  }
  const [col] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repairs' AND COLUMN_NAME = 'vehicleType'`);
  if (Number(col[0].n) === 0) {
    await db.query('ALTER TABLE repairs ADD COLUMN vehicleType varchar(60) DEFAULT NULL AFTER customerId');
    console.log('Database: added the column repairs.vehicleType');
  }
  // Profile photo of customers (saved in the database as text)
  const [pc] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'photo'`);
  if (Number(pc[0].n) === 0) {
    await db.query('ALTER TABLE customers ADD COLUMN photo MEDIUMTEXT NULL');
    console.log('Database: added the column customers.photo');
  }
  // Mechanic profile photo: a picture saved as text needs MEDIUMTEXT (it was varchar(200))
  const [mp] = await db.query(
    `SELECT DATA_TYPE AS t FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mechanics' AND COLUMN_NAME = 'photo'`);
  if (mp.length && String(mp[0].t).toLowerCase() !== 'mediumtext') {
    await db.query('ALTER TABLE mechanics MODIFY photo MEDIUMTEXT NULL');
    console.log('Database: mechanics.photo can now hold a profile picture');
  }
  // Photos of parts customers want to sell (saved as text, one picture per line)
  const [lp] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'photos'`);
  if (Number(lp[0].n) === 0) {
    await db.query('ALTER TABLE listings ADD COLUMN photos MEDIUMTEXT NULL AFTER description');
    console.log('Database: added the column listings.photos');
  }
  // A part the workshop bought from a customer: status 'bought' + the inventory part it became
  const [ls] = await db.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'status'`);
  if (ls.length && !String(ls[0].t).includes("'bought'")) {
    await db.query("ALTER TABLE listings MODIFY status ENUM('review','approved','rejected','bought') DEFAULT 'review'");
    console.log('Database: listings can now be marked as bought');
  }
  const [lpid] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'partId'`);
  if (Number(lpid[0].n) === 0) {
    await db.query('ALTER TABLE listings ADD COLUMN partId varchar(20) DEFAULT NULL AFTER status');
  }
  // Payment through WhatsApp: the admin marks a repair or a part order as paid
  for (const table of ['repairs', 'reservations']) {
    for (const [col, type] of [['paid', 'tinyint(1) DEFAULT 0'], ['paidAt', 'date DEFAULT NULL']]) {
      const [found] = await db.query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, col]);
      if (Number(found[0].n) === 0) {
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
        console.log(`Database: added the column ${table}.${col}`);
      }
    }
  }
  // Leave requests: a mechanic asks for leave, the admin approves or rejects it
  await db.query(`CREATE TABLE IF NOT EXISTS \`leave_requests\` (
  \`id\` varchar(20) NOT NULL,
  \`mechanicId\` varchar(20) NOT NULL,
  \`fromDate\` date NOT NULL,
  \`toDate\` date NOT NULL,
  \`reason\` varchar(300) DEFAULT NULL,
  \`status\` enum('pending','approved','rejected','finished','cancelled') DEFAULT 'pending',
  \`adminNote\` varchar(300) DEFAULT NULL,
  \`date\` date DEFAULT NULL,
  \`decidedAt\` date DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`mechanicId\` (\`mechanicId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);
  // Admin profile: phone + photo (Admin → My profile)
  for (const [col, type] of [['phone', 'varchar(20) DEFAULT NULL'], ['photo', 'MEDIUMTEXT NULL']]) {
    const [found] = await db.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = ?`, [col]);
    if (Number(found[0].n) === 0) {
      await db.query(`ALTER TABLE admins ADD COLUMN ${col} ${type}`);
      console.log('Database: added the column admins.' + col);
    }
  }
}

module.exports = { upgradeDatabase };
