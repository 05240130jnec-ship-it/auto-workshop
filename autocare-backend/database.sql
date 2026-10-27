-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 25, 2026 at 07:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `autoconnection`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `joined` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` varchar(20) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `reorder` int(11) DEFAULT 0,
  `price` decimal(10,2) DEFAULT 0.00,
  `supplierId` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `listings`
--

CREATE TABLE `listings` (
  `id` varchar(20) NOT NULL,
  `customerId` varchar(20) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `item_condition` varchar(30) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `qty` int(11) DEFAULT 1,
  `description` text DEFAULT NULL,
  `status` enum('review','approved','rejected') DEFAULT 'review',
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mechanics`
--

CREATE TABLE `mechanics` (
  `id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `experience` int(11) DEFAULT 0,
  `status` enum('active','busy','leave') DEFAULT 'active',
  `photo` varchar(200) DEFAULT NULL,
  `joined` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(20) NOT NULL,
  `partId` varchar(20) DEFAULT NULL,
  `qty` int(11) DEFAULT 1,
  `supplierId` varchar(20) DEFAULT NULL,
  `requestedBy` varchar(20) DEFAULT NULL,
  `status` enum('pending','approved','received','rejected') DEFAULT 'pending',
  `date` date DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repairs`
--

CREATE TABLE `repairs` (
  `id` varchar(20) NOT NULL,
  `customerId` varchar(20) NOT NULL,
  `vehicle` varchar(100) DEFAULT NULL,
  `plate` varchar(30) DEFAULT NULL,
  `service` varchar(100) DEFAULT NULL,
  `mechanicId` varchar(20) DEFAULT NULL,
  `status` enum('pending','progress','complete','cancelled') DEFAULT 'pending',
  `priority` enum('normal','high','urgent') DEFAULT 'normal',
  `date` date DEFAULT NULL,
  `due` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `apptDate` date DEFAULT NULL,
  `apptTime` varchar(20) DEFAULT NULL,
  `delivery` enum('dropoff','pickup') DEFAULT 'dropoff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair_parts`
--

CREATE TABLE `repair_parts` (
  `id` int(11) NOT NULL,
  `repairId` varchar(20) NOT NULL,
  `partId` varchar(20) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `qty` int(11) DEFAULT 1,
  `price` decimal(10,2) DEFAULT 0.00,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair_services`
--

CREATE TABLE `repair_services` (
  `id` int(11) NOT NULL,
  `repairId` varchar(20) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `qty` int(11) DEFAULT 1,
  `cost` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` varchar(20) NOT NULL,
  `customerId` varchar(20) NOT NULL,
  `slug` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `qty` int(11) DEFAULT 1,
  `pickup` date DEFAULT NULL,
  `status` enum('ready','collected','cancelled') DEFAULT 'ready',
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `person` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `supplierId` (`supplierId`);

--
-- Indexes for table `listings`
--
ALTER TABLE `listings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customerId` (`customerId`);

--
-- Indexes for table `mechanics`
--
ALTER TABLE `mechanics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partId` (`partId`),
  ADD KEY `supplierId` (`supplierId`);

--
-- Indexes for table `repairs`
--
ALTER TABLE `repairs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customerId` (`customerId`),
  ADD KEY `mechanicId` (`mechanicId`);

--
-- Indexes for table `repair_parts`
--
ALTER TABLE `repair_parts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repairId` (`repairId`),
  ADD KEY `partId` (`partId`);

--
-- Indexes for table `repair_services`
--
ALTER TABLE `repair_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repairId` (`repairId`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customerId` (`customerId`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `repair_parts`
--
ALTER TABLE `repair_parts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `repair_services`
--
ALTER TABLE `repair_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `listings`
--
ALTER TABLE `listings`
  ADD CONSTRAINT `listings_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`partId`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `repairs`
--
ALTER TABLE `repairs`
  ADD CONSTRAINT `repairs_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `repairs_ibfk_2` FOREIGN KEY (`mechanicId`) REFERENCES `mechanics` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `repair_parts`
--
ALTER TABLE `repair_parts`
  ADD CONSTRAINT `repair_parts_ibfk_1` FOREIGN KEY (`repairId`) REFERENCES `repairs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `repair_parts_ibfk_2` FOREIGN KEY (`partId`) REFERENCES `inventory` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `repair_services`
--
ALTER TABLE `repair_services`
  ADD CONSTRAINT `repair_services_ibfk_1` FOREIGN KEY (`repairId`) REFERENCES `repairs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
ALTER TABLE repairs ADD COLUMN workNotes TEXT NULL;