require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const dns = require('dns');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');


// Used to hash passwords - security measure
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

const app = express();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// Sends an email to subscribed users in this format
const generateAnnouncementEmail = (title, description, time, shelterName) => {
  return `
        <h1>${title}</h1>
        <p>${description}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Shelter:</strong> ${shelterName}</p>
    `;
};
// Sends the email from this Mailgun account
const sendEmail = (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: html
  };

  return transporter.sendMail(mailOptions);
};
const sendAnnouncementEmail = (title, description, time, shelterName, email) => {
  const emailContent = generateAnnouncementEmail(title, description, time, shelterName);
  return sendEmail(email, `Announcement: ${title}`, emailContent);
};

// session middleware
app.use(session({
  secret: 'WDC-Group-57-Secret-Key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax', // needed to be 'lax' for cross-site usage
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// static files
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialise Passport for Google Account login
app.use(passport.initialize());
app.use(passport.session());

// connection to the database
const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

// Passport setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const query = 'SELECT * FROM Users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return done(err);
    done(null, result[0]);
  });
});
// login with google
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-page.html' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Use GoogleStrategy within Passport
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
  (accessToken, refreshToken, profile, done) => {
    const googleID = profile.id;
    const email = profile.emails[0].value;
    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName;

    // Check if User already exists in the database with the same googleID
    const query = 'SELECT * FROM Users WHERE googleID = ?';
    db.query(query, [googleID], (err, result) => {
      if (err) return done(err);
      if (result.length > 0) return done(null, result[0]);

      // if not, add into the database with the following information
      const insertQuery = 'INSERT INTO Users (googleID, email, first_name, last_name) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [googleID, email, firstName, lastName], (err, result) => {
        if (err) return done(err);
        return done(null, { id: result.insertId, googleID, email, first_name: firstName, last_name: lastName });
      });
    });
  }
));

// Handle signup
app.post('/signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const domain = email.split('@')[1];
  dns.resolveMx(domain, (err, addresses) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
      return;
    }
    if (!(addresses && addresses.length > 0)) {
      res.status(400).json({ error: 'Invalid email domain' });
      return;
    }
    // Check if email is already stored in the database
    const checkQuery = 'SELECT * FROM Users WHERE email = ?';
    db.query(checkQuery, [email], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      } else if (result.length > 0) {
        res.status(400).json({ error: 'User already exists' });
      } else {
        bcrypt.genSalt(saltRounds, (err, salt) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
          } else {
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error' });
              } else {
                // if not, store into database
                const insertQuery = 'INSERT INTO Users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
                db.query(insertQuery, [firstName, lastName, email, hash], (err, result) => {
                  if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Server error' });
                  } else {
                    res.status(200).json({ message: 'User added successfully' });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
});

// Handle login
app.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM Users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
    } else {
      const user = results[0];
      // hashes the password
      const hashedPassword = user.password;
      bcrypt.compare(password, hashedPassword, (err, result) => {
        if (result === true) {
          req.session.regenerate((err) => {
            if (err) {
              return next(err);
            }
            req.login(user, (err) => {
              if (err) {
                return next(err);
              }
              return res.status(200).json({ message: 'Login successful' });
            });
          });
        } else {
          res.status(401).json({ error: 'Invalid email or password' });
        }
      });
    }
  });
});

// get user profile data
app.get('/user/profile', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT u.first_name AS firstName, u.last_name AS lastName, u.email, u.password, u.role,
           GROUP_CONCAT(s.shelter_id) AS managed_shelters
    FROM Users u
    LEFT JOIN Shelters s ON u.id = s.manager_id
    WHERE u.id = ?
    GROUP BY u.id
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(results[0]);
    }
  });
});

// delete user account
app.delete('/user/delete', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const query = 'DELETE FROM Users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    } else {
      req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        req.session.destroy((err) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          res.status(200).json({ message: 'Account deleted successfully' });
        });
      });
    }
  });
});

// Handle create shelter
app.post('/admin/create-shelter', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { shelterName, shelterManagerEmail, shelterLocation } = req.body;
  // Check if the manager email exists
  const getUserQuery = 'SELECT id FROM Users WHERE email = ?';
  db.query(getUserQuery, [shelterManagerEmail], (err, userResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (userResults.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const managerId = userResults[0].id;
    // Insert into Shelters table
    const createShelterQuery = 'INSERT INTO Shelters (shelter_name, manager_id, location) VALUES (?, ?, ?)';
    db.query(createShelterQuery, [shelterName, managerId, shelterLocation], (err, shelterResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json({ success: true, message: 'Shelter created successfully' });
    });
  });
});

// Fetch the list of all shelters
app.get('/admin/shelters', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const query = `
    SELECT s.shelter_id, s.shelter_name, u.email AS manager_email 
    FROM Shelters s 
    JOIN Users u ON s.manager_id = u.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ shelters: results });
  });
});

// Endpoint to get the logged-in user's ID
app.get('/api/get-user-id', ensureAuthenticated, (req, res) => {
  res.json({ user_id: req.user.id });
});
// Gets the subscribed users for managers
app.get('/api/manager-subscribed-users', ensureAuthenticated, (req, res) => {
  const managerId = req.user.id;
  console.log('Manager ID:', managerId); // Log Manager ID
  // Query to get the shelter managed by the manager
  const getShelterQuery = 'SELECT shelter_id FROM Shelters WHERE manager_id = ?';
  db.query(getShelterQuery, [managerId], (err, shelterResults) => {
    if (err) {
      console.error('Error fetching shelter:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (shelterResults.length === 0) {
      return res.status(400).json({ success: false, message: 'User does not manage any shelters' });
    }
    const shelterId = shelterResults[0].shelter_id;
    console.log('Shelter ID:', shelterId); // Log Shelter ID
    // Query to get subscribed users for the shelter
    const getSubscribedUsersQuery = `
      SELECT u.first_name, u.last_name, u.email
      FROM Users u
      JOIN Subscriptions s ON u.id = s.user_id
      WHERE s.shelter_id = ?
    `;
    db.query(getSubscribedUsersQuery, [shelterId], (err, userResults) => {
      if (err) {
        console.error('Error fetching subscribed users:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      console.log('Subscribed Users:', userResults); // Log Subscribed Users
      res.status(200).json({ success: true, users: userResults });
    });
  });
});

// Edit a shelter manager
app.post('/admin/edit-shelter-manager', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { shelterId, newManagerEmail } = req.body;
  if (!shelterId || !newManagerEmail) {
    return res.status(400).json({ error: 'Shelter ID and new manager email are required' });
  }
  const getUserQuery = 'SELECT id FROM Users WHERE email = ?';
  db.query(getUserQuery, [newManagerEmail], (err, userResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const managerId = userResults[0].id;
    const updateShelterQuery = 'UPDATE Shelters SET manager_id = ? WHERE shelter_id = ?';
    db.query(updateShelterQuery, [managerId, shelterId], (err, shelterResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(200).json({ success: true, message: 'Shelter manager updated successfully' });
    });
  });
});

// Endpoint to get all shelters with manager's email
app.get('/admin/get-shelters', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const getSheltersQuery = `
    SELECT s.shelter_name, s.location, u.email AS manager_email
    FROM Shelters s
    JOIN Users u ON s.manager_id = u.id`;

  db.query(getSheltersQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, data: results });
  });
});

// Endpoint to get all announcements
app.get('/admin/get-announcements', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const getAnnouncementsQuery = `
    SELECT id, title, description, time, shelter_name
    FROM Announcements`;
  db.query(getAnnouncementsQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, data: results });
  });
});

// Handle edit announcement
app.post('/admin/edit-announcement', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { id, title, description, time } = req.body;
  const updateAnnouncementQuery = `
    UPDATE Announcements
    SET title = ?, description = ?, time = ?
    WHERE id = ?`;
  db.query(updateAnnouncementQuery, [title, description, time, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.status(200).json({ success: true, message: 'Announcement updated successfully' });
  });
});

// Endpoint to delete an announcement
app.post('/admin/delete-announcement', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { id } = req.body;
  const deleteAnnouncementQuery = 'DELETE FROM Announcements WHERE id = ?';
  db.query(deleteAnnouncementQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  });
});

// Fetchs all events
app.get('/admin/get-events', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // orders the events based on the date
  const query = 'SELECT * FROM Events ORDER BY event_date DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Error fetching events: ' + err.message });
    }
    res.json({ success: true, data: results });
  });
});

// Edit event
app.put('/admin/edit-event', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { event_id, title, description, event_date, image_url } = req.body;
  // updates in the database
  const updateEventQuery = `
    UPDATE Events
    SET title = ?, description = ?, event_date = ?, image_url = ?
    WHERE event_id = ?`;
  db.query(updateEventQuery, [title, description, event_date, image_url, event_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Event updated successfully' });
  });
});

// Delete event
app.delete('/admin/delete-event/:event_id', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { event_id } = req.params;
  const deleteEventQuery = 'DELETE FROM Events WHERE event_id = ?';
  db.query(deleteEventQuery, [event_id], (err, result) => {
    if (err) {
      console.error('Error deleting event:', err);
      return res.status(500).json({ error: 'Error deleting event: ' + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  });
});

// Promote user to admin
app.post('/admin/add-admin', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { email } = req.body;
  const updateRoleQuery = 'UPDATE Users SET role = ? WHERE email = ?';
  db.query(updateRoleQuery, ['admin', email], (err, results) => {
    if (err) {
      console.error('Error promoting user to admin:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User promoted to admin successfully' });
  });
});

// Fetch all users
app.get('/admin/get-users', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const getUsersQuery = 'SELECT * FROM Users';
  db.query(getUsersQuery, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, data: results });
  });
});

// Delete a user
app.post('/admin/delete-user', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
  }
  const { id } = req.body;
  const deleteUserQuery = 'DELETE FROM Users WHERE id = ?';
  db.query(deleteUserQuery, [id], (err, results) => {
      if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ error: 'Server error' });
      }
      if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ success: true, message: 'User deleted successfully' });
  });
});


// Check if a user is a manager
app.get('/admin/is-manager/:userId', ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { userId } = req.params;
  const isManagerQuery = 'SELECT COUNT(*) AS isManager FROM Shelters WHERE manager_id = ?';
  db.query(isManagerQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error checking if user is a manager:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    const isManager = results[0].isManager === 1;
    res.status(200).json({ success: true, isManager });
  });
});

// Handle create announcement
app.post('/manager/create-announcement', ensureAuthenticated, (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;
  // Query to get the shelter managed by the user
  const getShelterQuery = 'SELECT shelter_name, shelter_id FROM Shelters WHERE manager_id = ?';
  db.query(getShelterQuery, [userId], (err, shelterResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (shelterResult.length === 0) {
      return res.status(400).json({ error: 'User does not manage any shelters' });
    }
    const shelterName = shelterResult[0].shelter_name;
    const shelterId = shelterResult[0].shelter_id;
    // Insert announcement into the database
    const insertAnnouncement = 'INSERT INTO Announcements (title, description, time, shelter_name) VALUES (?, ?, NOW(), ?)';
    db.query(insertAnnouncement, [title, description, shelterName], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      // Query to get subscribed users
      const getSubscribedUsersQuery = `
        SELECT Users.email
        FROM Subscriptions
        JOIN Users ON Subscriptions.user_id = Users.id
        WHERE Subscriptions.shelter_id = ?
      `;
      db.query(getSubscribedUsersQuery, [shelterId], (err, usersResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }

        const emailPromises = usersResult.map(user => {
          return sendAnnouncementEmail(title, description, new Date().toLocaleString(), shelterName, user.email);
        });
        Promise.all(emailPromises)
          .then(() => {
            res.status(200).json({ success: true, message: 'Announcement created and emails sent successfully' });
          })
          .catch(emailErr => {
            console.error(emailErr);
            res.status(500).json({ error: 'Announcement created but failed to send emails' });
          });
      });
    });
  });
});

//  handling the pet addition
app.post('/api/add-pet-to-adoption', (req, res) => {
  const { name, type, gender, age, breed, desexed, shelter_id, image_url } = req.body;
  const sql = 'INSERT INTO Pets (name, type, gender, age, breed, desexed, shelter_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [name, type, gender, age, breed, desexed, shelter_id, image_url];
  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error adding pet:', error);
      return res.status(500).json({ success: false, message: 'Error adding pet' });
    }
    return res.status(200).json({ success: true, message: 'Pet successfully added' });
  });
});
// Gets the pets for the managers based on the shelter they manage
app.get('/manager/get-pets', (req, res) => {
  const shelterId = req.query.shelter_id;
  const sql = 'SELECT * FROM Pets WHERE shelter_id = ?';
  db.query(sql, [shelterId], (error, results) => {
    if (error) {
      console.error('Error fetching pets:', error);
      return res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
    return res.status(200).json({ success: true, pets: results });
  });
});
// Gets all pets, will be used to display on the adoption-page.html
app.get('/api/pets', (req, res) => {
  const sql = 'SELECT * FROM Pets';
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching pets:', error);
      return res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
    return res.json({ success: true, pets: results });
  });
});
// Edit pet
app.post('/api/edit-pet', (req, res) => {
  const { pet_id, name, type, gender, age, breed, desexed, image_url } = req.body;
  const sql = 'UPDATE Pets SET name = ?, type = ?, gender = ?, age = ?, breed = ?, desexed = ?, image_url = ? WHERE pet_id = ?';
  const values = [name, type, gender, age, breed, desexed, image_url, pet_id];
  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error updating pet details:', error);
      return res.status(500).json({ success: false, message: 'Error updating pet details' });
    }
    return res.status(200).json({ success: true, message: 'Pet details successfully updated' });
  });
});
// Delete a pet up for adoption
app.post('/api/delete-pet', (req, res) => {
  const { pet_id } = req.body;
  const sql = 'DELETE FROM Pets WHERE pet_id = ?';
  const values = [pet_id];

  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error deleting pet:', error);
      return res.status(500).json({ success: false, message: 'Error deleting pet' });
    }
    return res.status(200).json({ success: true, message: 'Pet successfully deleted' });
  });
});

// fetch announcements for manager
app.get('/manager/announcements', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  // Query to get the shelter managed by the user
  const getShelterQuery = 'SELECT shelter_name FROM Shelters WHERE manager_id = ?';
  db.query(getShelterQuery, [userId], (err, shelterResult) => {
    if (err) {
      console.error('Error fetching shelter:', err);
      return res.status(500).json({ error: 'Error fetching shelter: ' + err.message });
    }
    if (shelterResult.length === 0) {
      return res.status(400).json({ error: 'User does not manage any shelters' });
    }
    const shelterName = shelterResult[0].shelter_name;
    // Query to get announcements for the user's shelter
    const getAnnouncementsQuery = 'SELECT * FROM Announcements WHERE shelter_name = ?';
    db.query(getAnnouncementsQuery, [shelterName], (err, announcementResults) => {
      if (err) {
        console.error('Error fetching announcements:', err);
        return res.status(500).json({ error: 'Error fetching announcements: ' + err.message });
      }
      res.status(200).json({ announcements: announcementResults });
    });
  });
});

// Route to fetch filtered announcements
app.get('/announcements', (req, res) => {
  const shelterName = req.query.shelterName; // Get  shelterName from query parameters
  let getAllAnnouncementsQuery = 'SELECT * FROM Announcements';
  if (shelterName) {
    getAllAnnouncementsQuery += ' WHERE shelter_name LIKE ?';
  }
  getAllAnnouncementsQuery += ' ORDER BY time DESC';
  db.query(getAllAnnouncementsQuery, [`%${shelterName}%`], (err, announcementResults) => {
    if (err) {
      console.error('Error fetching announcements:', err);
      return res.status(500).json({ error: 'Error fetching announcements: ' + err.message });
    }
    res.status(200).json({ announcements: announcementResults });
  });
});

// Used to check if user is logged in properly
app.get('/auth/status', (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
});

// User can only access the profile-page.html if they are logged in
app.get('/profile-page.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile-page.html'));
});
// Auth for login
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// routes that require authentication
app.get('/profile-page.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile-page.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-page.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  console.log('Index page works');
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });
});

app.get('/session', (req, res) => {
  res.send(`Session ID: ${req.sessionID}`);
});

// Edit announcement route
app.put('/manager/edit-announcement/:id', ensureAuthenticated, (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const updateAnnouncementQuery = 'UPDATE Announcements SET title = ?, description = ? WHERE id = ?';
  db.query(updateAnnouncementQuery, [title, description, id], (err, result) => {
    if (err) {
      console.error('Error updating announcement:', err);
      return res.status(500).json({ error: 'Error updating announcement: ' + err.message });
    }
    res.status(200).json({ success: true, message: 'Announcement updated successfully' });
  });
});

// Delete announcement route
app.delete('/manager/delete-announcement/:id', ensureAuthenticated, (req, res) => {
  const { id } = req.params;
  const deleteAnnouncementQuery = 'DELETE FROM Announcements WHERE id = ?';
  db.query(deleteAnnouncementQuery, [id], (err, result) => {
    if (err) {
      console.error('Error deleting announcement:', err);
      return res.status(500).json({ error: 'Error deleting announcement: ' + err.message });
    }
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  });
});

// Fetch the shelter ID for the logged-in manager
app.get('/manager/get-shelter-id', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const getShelterIdQuery = 'SELECT shelter_id FROM Shelters WHERE manager_id = ?';
  db.query(getShelterIdQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching shelter ID:', err);
      return res.status(500).json({ error: 'Error fetching shelter ID: ' + err.message });
    }
    if (results.length > 0) {
      res.status(200).json({ success: true, shelterId: results[0].shelter_id });
    } else {
      res.status(404).json({ success: false, error: 'No shelter found for this manager.' });
    }
  });
});

// Handle create event
app.post('/manager/create-event', ensureAuthenticated, (req, res) => {
  const { title, description, event_date, image_url, shelter_id } = req.body;
  // Insert event into the database
  const insertEventQuery = `
    INSERT INTO Events (title, description, event_date, image_url, shelter_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(insertEventQuery, [title, description, event_date, image_url, shelter_id], (err, result) => {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).json({ error: 'Error creating event: ' + err.message });
    }
    // Query to get subscribed users for the shelter
    const getSubscribedUsersQuery = `
      SELECT Users.email
      FROM Subscriptions
      JOIN Users ON Subscriptions.user_id = Users.id
      WHERE Subscriptions.shelter_id = ?
    `;
    db.query(getSubscribedUsersQuery, [shelter_id], (err, usersResult) => {
      if (err) {
        console.error('Error getting subscribed users:', err);
        return res.status(500).json({ error: 'Error getting subscribed users: ' + err.message });
      }
      const emailPromises = usersResult.map(user => {
        return sendEventEmail(title, description, event_date, image_url, user.email);
      });
      Promise.all(emailPromises)
        .then(() => {
          res.status(200).json({ success: true, message: 'Event created and emails sent successfully' });
        })
        .catch(emailErr => {
          console.error('Error sending event emails:', emailErr);
          res.status(500).json({ error: 'Event created but failed to send emails' });
        });
    });
  });
});

// V Still need to implement V
// Function to generate event email content
const generateEventEmail = (title, description, event_date, imageUrl) => {
  return `
    <h1>${title}</h1>
    <p>${description}</p>
    <p><strong>Event Date:</strong> ${event_date}</p>
    <img src="${imageUrl}" alt="Event Image" style="max-width: 100%;">
  `;
};

// Function to send event email
const sendEventEmail = (title, description, event_date, imageUrl, email) => {
  const emailContent = generateEventEmail(title, description, event_date, imageUrl);
  return sendEmail(email, `New Event: ${title}`, emailContent);
};

// Endpoint to get the shelters the user is subscribed to
app.get('/api/user-shelters', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const query = `
      SELECT S.shelter_id, S.shelter_name
      FROM Subscriptions SUB
      JOIN Shelters S ON SUB.shelter_id = S.shelter_id
      WHERE SUB.user_id = ?
  `;
  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Failed to fetch subscribed shelters:', error);
      res.json({ success: false, message: 'Failed to fetch subscribed shelters' });
    } else {
      res.json({ success: true, shelters: results });
    }
  });
});

// Endpoint to fetch all shelters
app.get('/api/join-shelter', (req, res) => {
  const query = 'SELECT shelter_id, shelter_name FROM Shelters';
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching shelters:', error);
      res.status(500).json({ success: false, message: 'Error fetching shelters' });
    } else {
      res.json({ success: true, shelters: results });
    }
  });
});
// Lets user subscirbe to a shelter to recieve future updates
app.post('/api/subscribe', (req, res) => {
  const { shelter_id, user_id } = req.body;
  console.log('Received subscription request:', req.body);
  if (!shelter_id || !user_id) {
    return res.status(400).json({ success: false, message: 'Shelter ID and User ID are required' });
  }
  const query = 'INSERT INTO Subscriptions (user_id, shelter_id) VALUES (?, ?)';
  db.query(query, [user_id, shelter_id], (error, results) => {
    if (error) {
      console.error('Error subscribing to shelter:', error);
      return res.status(500).json({ success: false, message: 'Error subscribing to shelter' });
    }
    res.json({ success: true, message: 'Subscribed successfully' });
  });
});

// Endpoint to unsubscribe from a shelter
app.post('/api/unsubscribe', ensureAuthenticated, (req, res) => {
  const { shelter_id, user_id } = req.body;
  if (!shelter_id || !user_id) {
    return res.status(400).json({ success: false, message: 'Shelter ID and User ID are required' });
  }
  // remove subscription
  const query = 'DELETE FROM Subscriptions WHERE user_id = ? AND shelter_id = ?';
  db.query(query, [user_id, shelter_id], (error, results) => {
    if (error) {
      console.error('Error unsubscribing from shelter:', error);
      return res.status(500).json({ success: false, message: 'Error unsubscribing from shelter' });
    }
    res.json({ success: true, message: 'Unsubscribed successfully' });
  });
});

// fetch all shelters
app.get('/api/shelters', (req, res) => {
  // fetch all shelters
  const query = 'SELECT shelter_id, shelter_name FROM Shelters';
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching shelters:', error);
      res.status(500).json({ success: false, message: 'Error fetching shelters' });
    } else {
      res.json({ success: true, shelters: results });
    }
  });
});

// Route to fetch events managed by the logged-in manager
app.get('/api/shelter-events/:shelterId', ensureAuthenticated, (req, res) => {
  const { shelterId } = req.params; // Get the shelter ID from the route parameter
  const query = 'SELECT * FROM Events WHERE shelter_id = ?';
  // the query
  db.query(query, [shelterId], (err, results) => {
    if (err) {
      console.error('Error fetching events for shelter:', err);
      return res.status(500).json({ error: 'Error fetching events for shelter: ' + err.message });
    }
    res.json(results);
  });
});

// Route to update an event
app.put('/api/update-event', ensureAuthenticated, (req, res) => {
  const { event_id, title, description, event_date, image_url } = req.body;
  const query = `
    UPDATE Events
    SET title = ?, description = ?, event_date = ?, image_url = ?
    WHERE event_id = ?
  `;
  db.query(query, [title, description, event_date, image_url, event_id], (err, results) => {
    if (err) {
      console.error('Error updating event:', err);
      return res.status(500).json({ error: 'Error updating event: ' + err.message });
    }
    res.json({ success: true });
  });
});

// Fetch all events
app.get('/events', (req, res) => {
  const query = 'SELECT * FROM Events ORDER BY event_date DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Error fetching events: ' + err.message });
    }
    res.json(results);
  });
});

// Route to check if a user has RSVP'd for an event
app.get('/events/:eventId/rsvp/status', ensureAuthenticated, (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user.id;
  console.log(`Checking RSVP status for event ID: ${eventId} by user ID: ${userId}`); // Debugging log
  const checkRsvpQuery = 'SELECT * FROM RSVPs WHERE user_id = ? AND event_id = ?';
  db.query(checkRsvpQuery, [userId, eventId], (err, rsvpResults) => {
    if (err) {
      console.error('Error checking RSVP status:', err);
      return res.status(500).json({ error: 'Error checking RSVP status: ' + err.message });
    }
    const rsvped = rsvpResults.length > 0;
    res.json({ rsvped });
  });
});

// handle RSVP cancellation
app.post('/events/:eventId/rsvp/cancel', ensureAuthenticated, (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user.id;
  console.log(`Cancelling RSVP for event ID: ${eventId} by user ID: ${userId}`); // Debug log
  const deleteRsvpQuery = 'DELETE FROM RSVPs WHERE user_id = ? AND event_id = ?';
  db.query(deleteRsvpQuery, [userId, eventId], (err, result) => {
    if (err) {
      console.error('Error cancelling RSVP:', err);
      return res.status(500).json({ error: 'Error cancelling RSVP: ' + err.message });
    }
    res.json({ message: 'RSVP cancelled' });
  });
});

// RSVP for an event
app.post('/events/:eventId/rsvp', ensureAuthenticated, (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user.id;
  console.log(`Received RSVP request for event ID: ${eventId} by user ID: ${userId}`); // remove once we figure out why its not working
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  // Check if the user has already RSVP'd
  const checkRsvpQuery = 'SELECT * FROM RSVPs WHERE user_id = ? AND event_id = ?';
  db.query(checkRsvpQuery, [userId, eventId], (err, rsvpResults) => {
    if (err) {
      console.error('Error checking existing RSVP:', err);
      return res.status(500).json({ error: 'Error checking existing RSVP: ' + err.message });
    }
    if (rsvpResults.length > 0) {
      // User has already RSVP'd, cancel the RSVP
      const deleteRsvpQuery = 'DELETE FROM RSVPs WHERE user_id = ? AND event_id = ?';
      db.query(deleteRsvpQuery, [userId, eventId], (err, results) => {
        if (err) {
          console.error('Error cancelling RSVP:', err);
          return res.status(500).json({ error: 'Error cancelling RSVP: ' + err.message });
        }
        res.status(200).json({ message: 'RSVP cancelled' });
      });
    } else {
      // User has not RSVP'd, insert new RSVP
      const rsvpQuery = 'INSERT INTO RSVPs (user_id, event_id) VALUES (?, ?)';
      db.query(rsvpQuery, [userId, eventId], (err, results) => {
        if (err) {
          console.error('Error RSVPing for event:', err);
          return res.status(500).json({ error: 'Error RSVPing for event: ' + err.message });
        }
        res.status(200).json({ message: 'RSVP successful' });
      });
    }
  });
});

//  RSVP list for an event
app.get('/events/:eventId/rsvp/list', ensureAuthenticated, (req, res) => {
  const eventId = req.params.eventId;
  // fetch RSVP list for the event with the correct table name
  const rsvpListQuery = 'SELECT Users.email FROM RSVPs INNER JOIN Users ON RSVPs.user_id = Users.id WHERE RSVPs.event_id = ?';
  db.query(rsvpListQuery, [eventId], (err, results) => {
    if (err) {
      console.error('Error fetching RSVP list:', err);
      return res.status(500).json({ error: 'Error fetching RSVP list.' });
    }
    // debugging
    // console.log('RSVP List Query Results:', results);
    // Ensure correct mapping of results to extract email
    const userList = results.map(result => result.email);
    res.json({ users: userList });
  });
});

// Delete event route
app.delete('/manager/delete-event/:event_id', ensureAuthenticated, (req, res) => {
  const { event_id } = req.params;
  const deleteEventQuery = 'DELETE FROM Events WHERE event_id = ?';
  db.query(deleteEventQuery, [event_id], (err, result) => {
    if (err) {
      console.error('Error deleting event:', err);
      return res.status(500).json({ error: 'Error deleting event: ' + err.message });
    }
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  });
});
// Used to send an emial notification to subscribed Users
app.post('/send-notification', async (req, res) => {
  const { announcementId, email } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM Announcements WHERE id = ?', [announcementId]);
    if (rows.length > 0) {
      const announcement = rows[0];
      const { title, description, time, shelter_name } = announcement;

      await sendAnnouncementEmail(title, description, time, shelter_name, email);
      res.json({ message: 'Notification email sent successfully!' });
    } else {
      res.status(404).json({ error: 'Announcement not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Thank you message
app.post('/send-thank-you-email', (req, res) => {
  const { name, amount, email } = req.body;
  const emailContent = generateThankYouEmail(name, amount);

  sendEmail(email, 'Thank You for Your Donation', emailContent)
    .then(() => res.json({ message: 'Email sent successfully!' }))
    .catch(error => res.status(500).json({ error: error.message }));
});
// Update profile (mainly password)
app.put('/user/update-profile', ensureAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    // Get the current user information
    db.query('SELECT * FROM Users WHERE id = ?', [userId], async (error, results) => {
      if (error) throw error;
      const user = results[0];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      // Update user information
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        email: email
      };
      // If a new password is provided, update it
      if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
      db.query('UPDATE Users SET ? WHERE id = ?', [updateData, userId], (updateError) => {
        if (updateError) throw updateError;
        res.json({ success: true });
      });
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating the profile' });
  }
});

module.exports = app;
