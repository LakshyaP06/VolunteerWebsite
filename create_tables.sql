CREATE TABLE `Announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `time` datetime DEFAULT NULL,
  `shelter_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_shelter_name` (`shelter_name`),
  CONSTRAINT `fk_shelter_name` FOREIGN KEY (`shelter_name`) REFERENCES `Shelters` (`shelter_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Shelters` (
  `shelter_id` int NOT NULL AUTO_INCREMENT,
  `shelter_name` varchar(255) DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`shelter_id`),
  UNIQUE KEY `shelter_name` (`shelter_name`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `Shelters_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `googleID` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT 'user',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
