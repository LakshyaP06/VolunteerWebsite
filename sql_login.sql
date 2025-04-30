-- MySQL dump 10.13  Distrib 8.0.37, for Linux (x86_64)
--
-- Host: localhost    Database: sql_login
-- ------------------------------------------------------
-- Server version	8.0.37-0ubuntu0.22.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Announcements`
--

DROP TABLE IF EXISTS `Announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `time` datetime DEFAULT NULL,
  `shelter_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_shelter_name` (`shelter_name`),
  CONSTRAINT `fk_shelter_name` FOREIGN KEY (`shelter_name`) REFERENCES `Shelters` (`shelter_name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Announcements`
--

LOCK TABLES `Announcements` WRITE;
/*!40000 ALTER TABLE `Announcements` DISABLE KEYS */;
INSERT INTO `Announcements` VALUES (1,'Join Us for the Grand Opening of Aussie Paws & Claws Shelter! (Edited)','We are thrilled to announce the grand opening of the Aussie Paws & Claws Shelter, a new haven for our furry friends in need. Our doors are open now, and we invite the entire community to join us in celebrating this momentous occasion.','2024-06-07 15:21:36','RSPCA Animal Care Campus'),(4,'Paws & Claws Winter Warm-Up Drive (Edited Again)','As the chilly winds blow in, Aussie Paws & Claws Shelter is launching the Winter Warm-Up Drive. We’re collecting blankets, pet sweaters, and heating pads to keep our residents cozy. Drop off your donations at our shelter or any participating local pet store. Together, we can ensure that every paw and claw stays warm this winter!','1969-12-31 14:30:00','RSPCA Port Lincoln Animal Care Centre'),(13,'Celebrating Our Fundraising Milestone','We continue to work towards our goal of $345,000 for the next stage of our shelter’s development, we are proud to announce that we have successfully gathered 30% of the required funds1. This achievement brings us closer to providing even better facilities and care for our beloved animals.','2024-06-17 22:34:15','RSPCA Animal Care Campus');
/*!40000 ALTER TABLE `Announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `event_date` datetime DEFAULT NULL,
  `image_url` text,
  `shelter_id` int DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `Events_ibfk_1` (`shelter_id`),
  CONSTRAINT `Events_ibfk_1` FOREIGN KEY (`shelter_id`) REFERENCES `Shelters` (`shelter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Events`
--

LOCK TABLES `Events` WRITE;
/*!40000 ALTER TABLE `Events` DISABLE KEYS */;
INSERT INTO `Events` VALUES (3,'Cats, Coffee, and Crafts','Relax with our resident cats at our cozy shelter café. Enjoy a cup of coffee while participating in a cat-themed craft workshop.','2024-06-26 15:42:00','https://simplypetspetsitting.com/wp-content/uploads/2019/10/play-with-cat-1024x683.jpg',1),(4,'Wings of Wonder: Bird Adoption Weekend','Discover the joy of feathered friends at our Bird Adoption Weekend. Enjoy special adoption rates and interactive sessions with our avian residents. It’s a perfect time to welcome a new bird into your family!','2024-06-26 15:45:00','https://a-z-animals.com/media/2023/07/shutterstock-1823611226-huge-licensed-scaled-1024x683.jpg',1),(5,'Hop to Health: Rabbit Run & Rally','Hop along with our hoppy friends at the Rabbit Run & Rally! This charity hop is for rabbit lovers and their furry companions. Proceeds will support our rabbit rescue efforts. Stay for the post-hop playdate and treats!','2024-06-20 06:16:00','https://petsoid.com/wp-content/uploads/2020/03/rabbit-and-kid-play.jpg',1),(6,'Aquatic Adventures: Marine Life Meetup','Dive into the deep blue at our Aquatic Adventures: Marine Life Meetup. Get up close with our aquatic friends, from colorful fish to graceful sea turtles, and learn about marine conservation.','2024-06-19 14:30:00','https://th.bing.com/th/id/OIP.D_3lIJPYqgHwCg1dc3Cc6wHaEK?rs=1&pid=ImgDetMain',2),(7,'Scales & Tails Reptile Rally','Slither into our world of reptiles at the Scales & Tails Reptile Rally! Discover fascinating facts about snakes, lizards, and more. Enjoy interactive exhibits and learn about reptile care from experts.','2024-06-19 14:30:00','https://www.everythingreptiles.com/wp-content/uploads/2020/04/Pet-Lizards.jpg',2),(8,'Paws in the Park','Join us for a day of fun under the sun with our furry friends! Bring your family and pets to the local park for games, a dog agility course, and a picnic area.','2024-06-20 01:35:00','https://cvets.net/wp-content/uploads/2020/08/CVETS-Enjoy-Playing-With-Your-Dog.jpg',2),(10,'Paws, Paints, and Picnics: A Creative Day Out','Join us at the Aussie Paws & Claws Shelter for a day filled with creativity and compassion. “Paws, Paints, and Picnics” is an event where animal lovers can unleash their artistic side alongside our adorable shelter residents. Bring your picnic blankets and paintbrushes, and we’ll provide the canvas and cuddles!','2024-06-22 22:36:00','https://media.istockphoto.com/id/1218614835/photo/small-dog-carrying-or-fetching-a-paintbrush.jpg?s=612x612&w=0&k=20&c=Zyq5JRFwTXsoZZYIdEH7FdKxzD6EZWhrJMDNZ5lpC2w=',1);
/*!40000 ALTER TABLE `Events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pets`
--

DROP TABLE IF EXISTS `Pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pets` (
  `pet_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `age` varchar(50) DEFAULT NULL,
  `breed` varchar(100) DEFAULT NULL,
  `desexed` enum('Yes','No') DEFAULT NULL,
  `shelter_id` int DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`pet_id`),
  KEY `shelter_id` (`shelter_id`),
  CONSTRAINT `Pets_ibfk_1` FOREIGN KEY (`shelter_id`) REFERENCES `Shelters` (`shelter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pets`
--

LOCK TABLES `Pets` WRITE;
/*!40000 ALTER TABLE `Pets` DISABLE KEYS */;
INSERT INTO `Pets` VALUES (8,'Lawrence','Male','3 Months Old','Domestic Short Hair - DSH','Yes',1,'Cat','https://rspcasa.sheltermate.com/storage/image/548cf9d5649346abb26655a7a15ca5e1-1718329542-1718329934-jpg/600---n'),(9,'Tallulah','Female','3 Months Old','Domestic Short Hair - DSH','Yes',1,'Cat','https://rspcasa.sheltermate.com/storage/image/13fc41103aff4076b9bf1a5fec140d23-1718071388-1718071396-jpeg/600---n'),(10,'Zala','Female','4 Years Old','Cross Breed','Yes',1,'Dog','https://rspcasa.sheltermate.com/storage/image/c1af85d939df41b08d9ba0b8107a8fd6-1710631328-1710815755-jpeg/600---n'),(11,'Flopsy','Male','1 Years Old','Lop Eared','Yes',2,'Rabbit','https://rspcasa.sheltermate.com/storage/image/19e21d0b1cf84241b49a9be019b27c7b-1718254688-1718254732-jpg/600---n'),(12,'Zeus','Male','2 Years Old','Staffordshire Bull Terrier','Yes',3,'Dog','https://rspcasa.sheltermate.com/storage/image/6f9d3d6800f3450dad0ea94f1c176ba6-1713603421-1713603434-jpeg/600---n'),(13,'Blaze','Female','1 Years Old','Cross Breed, Medium','Yes',3,'Dog','https://rspcasa.sheltermate.com/storage/image/4240103080814d0fb847500ebaf23a18-1717125711-1717125799-jpeg/600---n'),(14,'Eddie','Male','1 Years Old','Domestic Short Hair - DSH','Yes',3,'Cat','https://rspcasa.sheltermate.com/storage/image/da63257111d44911853b4d9e71f6f059-1715413261-1715413291-jpeg/600---n'),(15,'Whisker','Male','2 years old','Domestic Short Hair - DSH','Yes',1,'Cat','https://catexplore.com/wp-content/uploads/2022/04/cat-loaf-gray-tabby.jpg');
/*!40000 ALTER TABLE `Pets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RSVPs`
--

DROP TABLE IF EXISTS `RSVPs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RSVPs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `rsvp_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `RSVPs_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `Events` (`event_id`),
  CONSTRAINT `RSVPs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RSVPs`
--

LOCK TABLES `RSVPs` WRITE;
/*!40000 ALTER TABLE `RSVPs` DISABLE KEYS */;
INSERT INTO `RSVPs` VALUES (1,4,6,'2024-06-13 01:07:24'),(3,4,18,NULL);
/*!40000 ALTER TABLE `RSVPs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Shelters`
--

DROP TABLE IF EXISTS `Shelters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Shelters` (
  `shelter_id` int NOT NULL AUTO_INCREMENT,
  `shelter_name` varchar(255) DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`shelter_id`),
  UNIQUE KEY `shelter_name` (`shelter_name`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `Shelters_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Shelters`
--

LOCK TABLES `Shelters` WRITE;
/*!40000 ALTER TABLE `Shelters` DISABLE KEYS */;
INSERT INTO `Shelters` VALUES (1,'RSPCA Animal Care Campus',7,'9a Majors Road, O’Halloran Hill'),(2,'RSPCA Port Lincoln Animal Care Centre',12,'22 Windsor Avenue, Port Lincoln'),(3,'RSPCA Whyalla Shelter',13,'7 Cook Street, Whyalla Norrie.'),(4,'test shelter',18,'Somewhere');
/*!40000 ALTER TABLE `Shelters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Subscriptions`
--

DROP TABLE IF EXISTS `Subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Subscriptions` (
  `subscription_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `shelter_id` int NOT NULL,
  `subscription_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`subscription_id`),
  KEY `user_id` (`user_id`),
  KEY `shelter_id` (`shelter_id`),
  CONSTRAINT `Subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `Subscriptions_ibfk_2` FOREIGN KEY (`shelter_id`) REFERENCES `Shelters` (`shelter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Subscriptions`
--

LOCK TABLES `Subscriptions` WRITE;
/*!40000 ALTER TABLE `Subscriptions` DISABLE KEYS */;
INSERT INTO `Subscriptions` VALUES (6,15,2,'2024-06-15 22:57:24'),(8,15,3,'2024-06-16 00:41:16'),(9,9,1,'2024-06-16 14:08:56'),(11,17,1,'2024-06-17 03:41:41'),(12,18,1,'2024-06-17 22:33:27');
/*!40000 ALTER TABLE `Subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `googleID` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT 'user',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (6,'lakshyapatel06@gmail.com','$2b$10$0ju45EB3rlUI7N7EUp7BHeY2AoF6aTkF2iILni.yuvAdI3Mwh2bFi','Lakshya','Patel',NULL,'admin'),(7,'email@email.com','$2b$10$vB./hnM5c65dqnrRX2.kL.BpCzuCyeB0tJW1mkBu3XbQnlHdZz/Cm','Admin','Account',NULL,'user'),(9,'lakshyapateltemp@gmail.com',NULL,'Lakshya','Patel','114332225925953142406','user'),(12,'someone@gmail.com','$2b$10$HkN76XK740bSoCq6CMbFT.eFhUOnT22eLZvX1.7pxJ5jJ5ZrwjHFa','test','test',NULL,'user'),(13,'jaxen68761@picdv.com','$2b$10$CgVfjYbtCWELPSLF.oowneeiVNJK/9dUSSTdq5HkPV4Ay0nms1wCm','Jaxen','Someone',NULL,'user'),(15,'temporary@gmail.com','$2b$10$6nWFju1W7s0ET1aTu83aluPHBr.o4aBNGARu69pZ4RS2xeHWjEKYG','Temporary','Temporary',NULL,'user'),(17,'yilico2002@eqvox.com','$2b$10$HgsP.9ZU5FoaBjjC5aYX8OlK513uNSgq9tLNZcZMniahnbciMGDku','Yil','Ico',NULL,'user'),(18,'joroj32573@dovinou.com','$2b$10$MxgIV9wqoqOO2P78Zx2lreYsYn9jSZd9uzL9NBQZhZ3TzI7CKLDpa','Bob','Jones',NULL,'admin');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-17 23:38:34
