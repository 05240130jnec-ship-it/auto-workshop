-- =====================================================
--  AutoCare Pro — database tables (MySQL / MariaDB)
--  Run automatically by:  npm run setup-db
--  WARNING: this deletes and recreates every table.
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS work_notes, repair_services, repair_parts, repairs,
  purchase_orders, reservations, listings, inventory, suppliers,
  mechanics, customers, admins;
SET FOREIGN_KEY_CHECKS = 1;

-- Admin accounts
CREATE TABLE admins (
  id            VARCHAR(10)  PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL
);

-- Customers (people who book services)
CREATE TABLE customers (
  id            VARCHAR(10)  PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address       VARCHAR(150),
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  joined        DATE NOT NULL
);

-- Mechanics (workshop staff)
CREATE TABLE mechanics (
  id             VARCHAR(10)  PRIMARY KEY,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  specialization VARCHAR(60)  NOT NULL,
  experience     INT NOT NULL DEFAULT 0,
  status         ENUM('active','busy','leave') NOT NULL DEFAULT 'active',
  photo          VARCHAR(200),
  dob            DATE,
  address        VARCHAR(150),
  joined         DATE NOT NULL
);

-- Suppliers (companies we buy parts from)
CREATE TABLE suppliers (
  id      VARCHAR(10)  PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  person  VARCHAR(80)  NOT NULL,
  phone   VARCHAR(20)  NOT NULL,
  email   VARCHAR(120),
  address VARCHAR(150) NOT NULL
);

-- Spare parts in stock
CREATE TABLE inventory (
  id            VARCHAR(10)  PRIMARY KEY,
  sku           VARCHAR(30)  NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(40)  NOT NULL,
  stock         INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  price         INT NOT NULL,
  supplier_id   VARCHAR(10),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Repair jobs (one row per booking)
CREATE TABLE repairs (
  id           VARCHAR(12) PRIMARY KEY,
  customer_id  VARCHAR(10) NOT NULL,
  mechanic_id  VARCHAR(10) NULL,
  vehicle      VARCHAR(80) NOT NULL,
  plate        VARCHAR(20) NOT NULL,
  service      VARCHAR(60) NOT NULL,
  status       ENUM('pending','progress','complete','cancelled') NOT NULL DEFAULT 'pending',
  priority     ENUM('normal','high','urgent') NOT NULL DEFAULT 'normal',
  booked_on    DATE NOT NULL,
  due          DATE NOT NULL,
  started_on   DATE NULL,
  completed_on DATE NULL,
  cost         INT NOT NULL DEFAULT 0,
  notes        TEXT,
  appt_date    DATE NULL,
  appt_time    VARCHAR(10) NULL,
  delivery     ENUM('dropoff','pickup') NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL
);

-- Parts used on a repair (one row per part line)
CREATE TABLE repair_parts (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  repair_id VARCHAR(12) NOT NULL,
  part_id   VARCHAR(10) NULL,
  name      VARCHAR(100) NOT NULL,
  qty       INT NOT NULL,
  price     INT NOT NULL,           -- price at the time it was used
  used_on   DATE NOT NULL,
  FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES inventory(id) ON DELETE SET NULL
);

-- Labour / services charged on a repair
CREATE TABLE repair_services (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  repair_id VARCHAR(12) NOT NULL,
  name      VARCHAR(80) NOT NULL,
  qty       INT NOT NULL DEFAULT 1,
  cost      INT NOT NULL,
  FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE
);

-- Mechanic progress notes on a repair
CREATE TABLE work_notes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  repair_id  VARCHAR(12) NOT NULL,
  author     VARCHAR(80) NOT NULL,
  note       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE
);

-- Purchase orders for restocking parts
CREATE TABLE purchase_orders (
  id           VARCHAR(12) PRIMARY KEY,
  part_id      VARCHAR(10) NULL,
  supplier_id  VARCHAR(10) NULL,
  requested_by VARCHAR(10) NOT NULL,   -- a mechanic id, or 'admin'
  qty          INT NOT NULL,
  status       ENUM('pending','approved','received','rejected') NOT NULL DEFAULT 'pending',
  order_date   DATE NOT NULL,
  note         VARCHAR(255),
  FOREIGN KEY (part_id) REFERENCES inventory(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Parts customers ordered from the shop (pay at pickup)
CREATE TABLE reservations (
  id          VARCHAR(12) PRIMARY KEY,
  customer_id VARCHAR(10) NOT NULL,
  slug        VARCHAR(40) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  price       INT NOT NULL,
  qty         INT NOT NULL,
  pickup      DATE NOT NULL,
  status      ENUM('ready','collected') NOT NULL DEFAULT 'ready',
  created_on  DATE NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Parts customers want to sell (admin reviews them)
CREATE TABLE listings (
  id             VARCHAR(12) PRIMARY KEY,
  customer_id    VARCHAR(10) NOT NULL,
  name           VARCHAR(100) NOT NULL,
  category       VARCHAR(40)  NOT NULL,
  item_condition VARCHAR(20)  NOT NULL,
  price          INT NOT NULL,
  qty            INT NOT NULL,
  description    TEXT NOT NULL,
  status         ENUM('review','approved','rejected') NOT NULL DEFAULT 'review',
  created_on     DATE NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
