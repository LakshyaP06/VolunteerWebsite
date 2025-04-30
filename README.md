# 2023 Project - Volunteer Website 
This project was created with 2 other students from University of Adelaide.

Pet Shelter was a full-stack web application designed to streamline volunteer coordination for animal shelters and community organizations, similar to RSPCA. The platform connects volunteers with shelters, facilitates event management, and provides robust tools for administrators and organization managers. Built with modern web technologies, it emphasizes usability, accessibility, and seamless interaction across all user roles.

# 1. User-Friendly Interface & Accessibility
✅ Visually Consistent & Appealing Design
Responsive layout with dark/light mode to reduce cognitive load.
WCAG-compliant accessibility (screen reader support, keyboard navigation).

✅ Role-Based Access Control (RBAC)
Volunteers: Browse events, RSVP, and join organizations.
Managers: Post updates/events, track attendees, and manage members.
Admins: Oversee all users, organizations, and system settings.

✅ Flexible Authentication
Email/password sign-up or OAuth/OpenID (Google, Facebook).
Guest access for browsing public events.

# 2. Volunteer & Event Management
📅 Seamless Event RSVP & Tracking
Volunteers can discover and join events with one click.
Managers view real-time attendee lists and send reminders.

📢 Dynamic Communication
Email notifications for event updates.

# 3. Admin & Organization Tools
🛠 Centralized Dashboard
Admins create/edit branches, assign managers, and audit logs.
Managers approve members and post public/member-only updates.

📊 User Management
Volunteers update profiles/preferences.
Admins ban users, reset passwords, etc.

Technical Implementation
Frontend
Vue.js for dynamic, component-based UI.
AJAX for seamless data fetching (no page reloads).
Third-Party API Integration (Google Maps for location, SendGrid for emails).

Backend
Express REST API with JWT authentication.

Impact & Use Cases
Volunteers: Easily find and commit to shelter events.
Shelters: Reduce administrative overhead with automated tools.
Communities: Boost engagement through social sharing.
