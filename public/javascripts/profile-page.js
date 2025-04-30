$(document).ready(function () {
    // Check authentication status
    $.get('/auth/status', function (data) {
        if (!data.authenticated) {
            window.location.href = '/login';
        } else {
            // Get user data and role when the page loads
            $.get('/user/profile', function (data) {
                $('#first-name').val(data.firstName);
                $('#last-name').val(data.lastName);
                $('#email').val(data.email);
                // Determine user role and show relevant settings
                const role = data.role;
                const managedShelters = data.managed_shelters ? data.managed_shelters.split(',') : [];
                if (managedShelters.length > 0) {
                    $('#settings-links').append('<li><a href="#" id="manager-settings-link"><i class="bi bi-briefcase"></i> Manager</a></li>');
                    $('#manager-settings-link').on('click', function () {
                        $('#personal-settings').hide();
                        $('#manager-settings').show();
                        $('#admin-settings').hide();
                        fetchAndDisplayAnnouncements(); // Fetch and display announcements for manager
                        fetchAndDisplayEvents(managedShelters[0]);  // Fetch and displays events for manager
                        fetchSubscribedUsers();// Fetch and display subed users for managers
                    });
                }
                if (role === 'admin') {
                    $('#settings-links').append('<li><a href="#" id="admin-settings-link"><i class="bi bi-shield-lock"></i> Admin</a></li>');
                    $('#admin-settings-link').on('click', function () {
                        $('#personal-settings').hide();
                        $('#manager-settings').hide();
                        $('#admin-settings').show();
                    });
                }

                // Load personal settings by default
                $('#personal-settings-link').on('click', function () {
                    $('#personal-settings').show();
                    $('#manager-settings').hide();
                    $('#admin-settings').hide();
                }).click(); // Trigger default click to show personal settings
            });

            // Handle form submission for updating user info
            $('#personal-settings-form').on('submit', function (event) {
                event.preventDefault();
                const userData = {
                    firstName: $('#first-name').val(),
                    lastName: $('#last-name').val(),
                    email: $('#email').val(),
                    currentPassword: $('#password').val(),
                    newPassword: $('#new-password').val()
                };
                $.ajax({
                    url: '/user/update-profile',
                    type: 'PUT',
                    data: JSON.stringify(userData),
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.success) {
                            alert('Profile updated successfully');
                        } else {
                            alert('Failed to update profile: ' + response.message);
                        }
                    },
                    error: function (err) {
                        alert('An error occurred while updating your profile.');
                    }
                });
            });
            // Toggle password visibility
            $('#toggle-current-password, #toggle-new-password').on('click', function () {
                const passwordField = $(this).closest('.input-group').find('input');
                const passwordFieldType = passwordField.attr('type');
                const newPasswordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
                passwordField.attr('type', newPasswordFieldType);
                $(this).text(newPasswordFieldType === 'password' ? 'Show' : 'Hide');
            });

            // Account deletion
            $('#delete-account').on('click', function () {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    $.ajax({
                        url: '/user/delete',
                        type: 'DELETE',
                        success: function (result) {
                            window.location.href = '/index.html';
                        },
                        error: function (err) {
                            alert('An error occurred while deleting your account.');
                        }
                    });
                }
            });
        }
    });


    // Function to fetch and display shelter information
    function loadShelters() {
        $.get('/admin/get-shelters', function (response) {
            if (response.success) {
                const shelters = response.data;
                const shelterContainer = $('.shelter-container');
                shelterContainer.empty(); // remove any existing content
                shelters.forEach(shelter => {
                    const shelterCard = `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${shelter.shelter_name}</h5>
                                <p class="card-text"><strong>Location:</strong> ${shelter.location}</p>
                                <p class="card-text"><strong>Manager Email:</strong> ${shelter.manager_email}</p>
                            </div>
                        </div>`;
                    shelterContainer.append(shelterCard);
                });
            } else {
                alert('Failed to load shelters');
            }
        }).fail(function () {
            alert('An error occurred while fetching shelters.');
        });
    }

    // Function to fetch and display announcement information
    function loadAnnouncements() {
        $.get('/admin/get-announcements', function (response) {
            if (response.success) {
                const announcements = response.data;
                const announcementContainer = $('.announcement-container');
                announcementContainer.empty(); // removes any existing content

                announcements.forEach(announcement => {
                    const announcementCard = `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${announcement.title}</h5>
                            <p class="card-text">${announcement.description}</p>
                            <p class="card-text"><small class="text-muted">Shelter: ${announcement.shelter_name}</small></p>
                            <button type="button" class="btn btn-warning edit-announcement" data-id="${announcement.id}">Edit Announcement</button>
                            <button type="button" class="btn btn-danger delete-announcement" data-id="${announcement.id}">Delete Announcement</button>
                        </div>
                    </div>`;
                    announcementContainer.append(announcementCard);
                });
                // Add click handlers for the edit and delete buttons
                $('.edit-announcement').on('click', function () {
                    const id = $(this).data('id');
                    const announcement = announcements.find(a => a.id === id);
                    if (announcement) {
                        $('#edit-announcement-id-admin').val(announcement.id);
                        $('#edit-announcement-title-admin').val(announcement.title);
                        $('#edit-announcement-description-admin').val(announcement.description);
                        $('#edit-announcement-time-admin').val(new Date(announcement.time).toISOString().slice(0, 16));
                        $('#editAnnouncementModalAdmin').modal('show');
                    }
                });

                $('.delete-announcement').on('click', function () {
                    const id = $(this).data('id');
                    if (confirm('Are you sure you want to delete this announcement?')) {
                        $.post('/admin/delete-announcement', { id }, function (response) {
                            if (response.success) {
                                loadAnnouncements(); // Should reload announcements after deletion
                            } else {
                                alert('Failed to delete announcement');
                            }
                        }).fail(function () {
                            alert('An error occurred while deleting the announcement.');
                        });
                    }
                });
            } else {
                alert('Failed to load announcements');
            }
        }).fail(function () {
            alert('An error occurred while fetching announcements.');
        });
    }

    // Handle form submission for editing an announcement (admin)
    $('#edit-announcement-form-admin').on('submit', function (event) {
        event.preventDefault();
        const id = $('#edit-announcement-id-admin').val();
        const title = $('#edit-announcement-title-admin').val();
        const description = $('#edit-announcement-description-admin').val();
        const time = $('#edit-announcement-time-admin').val();
        $.post('/admin/edit-announcement', { id, title, description, time }, function (response) {
            if (response.success) {
                $('#editAnnouncementModalAdmin').modal('hide');
                loadAnnouncements();
            } else {
                alert('Failed to update announcement');
            }
        }).fail(function () {
            alert('An error occurred while updating the announcement.');
        });
    });

    // display event information
    function loadEvents() {
        $.get('/admin/get-events', function (response) {
            if (response.success) {
                const events = response.data;
                const eventContainer = $('.event-container');
                eventContainer.empty(); // removes any existing content
                events.forEach(event => {
                    const eventCard = `
                    <div class="card mb-3">
                        <img class="card-img-top" src="${event.image_url}" alt="${event.title}">
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text">${event.description}</p>
                            <p class="card-text"><small class="text-muted">Date: ${new Date(event.event_date).toLocaleString()}</small></p>
                            <button type="button" class="btn btn-warning edit-event" data-id="${event.event_id}">Edit Event Details</button>
                            <button type="button" class="btn btn-danger delete-event" data-id="${event.event_id}">Delete Event</button>
                        </div>
                    </div>`;
                    eventContainer.append(eventCard);
                });
                // edit and delete buttons
                $('.edit-event').on('click', function () {
                    const id = $(this).data('id');
                    const event = events.find(e => e.event_id === id);
                    if (event) {
                        $('#edit-event-id-admin').val(event.event_id);
                        $('#edit-event-title-admin').val(event.title);
                        $('#edit-event-description-admin').val(event.description);
                        $('#edit-event-date-admin').val(new Date(event.event_date).toISOString().slice(0, 16));
                        $('#edit-event-image-url-admin').val(event.image_url);
                        $('#editEventModalAdmin').modal('show');
                    }
                });
                // delete event handler
                $('.delete-event').on('click', function () {
                    const id = $(this).data('id');
                    if (confirm('Are you sure you want to delete this event?')) {
                        $.ajax({
                            url: `/admin/delete-event/${id}`,
                            type: 'DELETE',
                            success: function (response) {
                                if (response.success) {
                                    loadEvents(); // Reload events after deletion
                                } else {
                                    alert('Failed to delete event');
                                }
                            },
                            error: function () {
                                alert('An error occurred while deleting the event.');
                            }
                        });
                    }
                });
            } else {
                alert('Failed to load events');
            }
        }).fail(function () {
            alert('An error occurred while fetching events.');
        });
    }

    // form submission for editing an event (admin)
    $('#edit-event-form-admin').on('submit', function (event) {
        event.preventDefault();
        const id = $('#edit-event-id-admin').val();
        const title = $('#edit-event-title-admin').val();
        const description = $('#edit-event-description-admin').val();
        const event_date = $('#edit-event-date-admin').val();
        const image_url = $('#edit-event-image-url-admin').val();
        $.ajax({
            url: '/admin/edit-event',
            type: 'PUT',
            data: { event_id: id, title, description, event_date, image_url },
            success: function (response) {
                if (response.success) {
                    $('#editEventModalAdmin').modal('hide');
                    loadEvents();
                } else {
                    alert('Failed to update event');
                }
            },
            error: function () {
                alert('An error occurred while updating the event.');
            }
        });
    });

    // Load events when the admin settings are displayed
    $('#admin-settings').on('show', function () {
        loadShelters();
        loadAnnouncements();
        loadEvents();
    });

    // Initialise settings links and sidebar toggle logic
    $('#settings-links').on('click', 'a', function () {
        const target = $(this).attr('id').replace('-link', '');
        $('#personal-settings, #manager-settings, #admin-settings').hide();
        $(`#${target}`).show();
        if (target === 'admin-settings') {
            loadShelters();
            loadAnnouncements();
            loadEvents();
            loadUsers();
        }
    });

    // submission for adding an admin
    $('#add-admin-form').on('submit', function (event) {
        event.preventDefault();

        const email = $('#admin-email').val();

        $.post('/admin/add-admin', { email }, function (response) {
            if (response.success) {
                $('#addAdminModal').modal('hide');
                alert('User promoted to admin successfully');
            } else {
                alert('Failed to promote user to admin: ' + response.error);
            }
        }).fail(function () {
            alert('An error occurred while promoting the user to admin.');
        });
    });

    // Function to load users
    function loadUsers() {
        $.get('/admin/get-users', function (response) {
            if (response.success) {
                const users = response.data;
                const userTableBody = $('.user-table tbody');
                userTableBody.empty(); // removes any existing content

                users.forEach(user => {
                    let roleLabel = '';
                    if (user.role === 'user') {
                        roleLabel = '<span class="badge badge-primary">User</span>';
                    } else if (user.role === 'admin') {
                        roleLabel = '<span class="badge badge-danger">Admin</span>';
                    } else {
                        roleLabel = '<span class="badge badge-info">Manager</span>';
                    }

                    // Check if user is a manager by querying the Shelters table
                    if (user.role !== 'admin') {
                        $.get(`/admin/is-manager/${user.id}`, function (managerResponse) {
                            if (managerResponse.success && managerResponse.isManager) {
                                roleLabel = '<span class="badge badge-success">Manager</span>';
                            }
                            const userRow = `
                        <tr>
                            <td>${user.first_name} ${user.last_name}</td>
                            <td>${user.email}</td>
                            <td>${roleLabel}</td>
                            <td>
                                ${user.role !== 'admin' ? `<button type="button" class="btn btn-danger delete-user" data-id="${user.id}">x</button>` : ''}
                            </td>
                        </tr>`;
                            userTableBody.append(userRow);
                        }).fail(function () {
                            alert('Failed to check if user is a manager');
                        });
                    } else {
                        const userRow = `
                    <tr>
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.email}</td>
                        <td>${roleLabel}</td>
                        <td></td> <!-- Empty column for admin without delete button -->
                    </tr>`;
                        userTableBody.append(userRow);
                    }
                });

                $(document).on('click', '.delete-user', function () {
                    const id = $(this).data('id');
                    if (confirm('Are you sure you want to delete this user?')) {
                        $.post('/admin/delete-user', { id }, function (response) {
                            if (response.success) {
                                loadUsers(); // Reload users after deletion
                            } else {
                                alert('Failed to delete user');
                            }
                        }).fail(function () {
                            alert('An error occurred while deleting the user.');
                        });
                    }
                });                
            } else {
                alert('Failed to load users');
            }
        }).fail(function () {
            alert('An error occurred while fetching users.');
        });
    }

    function fetchSubscribedUsers() {
        fetch('/api/manager-subscribed-users')
            .then(response => response.json())
            .then(data => {
                console.log('Subscribed Users Response:', data); // Log
                if (data.success) {
                    displaySubscribedUsers(data.users);
                } else {
                    console.error('Failed to fetch subscribed users:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching subscribed users:', error);
            });
    }    

    function displaySubscribedUsers(users) {
        const container = document.querySelector('.subscribed-users-container');
        container.innerHTML = ''; // removes previous content
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title';
            cardTitle.textContent = `${user.first_name} ${user.last_name}`;
            const email = document.createElement('p');
            email.className = 'card-text';
            email.textContent = user.email;
            cardBody.appendChild(cardTitle);
            cardBody.appendChild(email);
            card.appendChild(cardBody);
            container.appendChild(card);
        });
    }    

    $('#manager-settings-link').on('click', function () {
        $('#personal-settings').hide();
        $('#manager-settings').show();
        $('#admin-settings').hide();
        fetchAndDisplayAnnouncements(); // Fetch and display announcements for manager
        fetchAndDisplayEvents(managedShelters[0]); // Fetch and display events for manager
        fetchSubscribedUsers(); // Load subscribed users the manager
        displaySubscribedUsers(); // Load subscribed users to the managers
    });    

    function fetchAndDisplayAnnouncements() {
        $.get('/manager/announcements', function (data) {
            const announcementContainer = $('.announcement-container');
            announcementContainer.empty(); // removes any existing announcements
            data.announcements.forEach(function (announcement) {
                const announcementCard = `
                    <div class="card mb-3 announcement-card">
                        <div class="card-body">
                            <h5 class="card-title">${announcement.title}</h5>
                            <p class="card-text">${announcement.description}</p>
                            <p class="card-text"><small class="text-muted">Posted on ${new Date(announcement.time).toLocaleString()}</small></p>
                            <button class="btn btn-primary edit-announcement" data-id="${announcement.id}" data-title="${announcement.title}" data-description="${announcement.description}">Edit</button>
                            <button class="btn btn-danger delete-announcement" data-id="${announcement.id}">Delete</button>
                        </div>
                    </div>`;
                announcementContainer.append(announcementCard);
            });

            // event handlers for edit and delete buttons
            $('.edit-announcement').on('click', function () {
                const id = $(this).data('id');
                const title = $(this).data('title');
                const description = $(this).data('description');
                $('#edit-announcement-id').val(id);
                $('#edit-announcement-title').val(title);
                $('#edit-announcement-description').val(description);
                $('#editAnnouncementModal').modal('show');
            });
            // delete announcements
            $('.delete-announcement').on('click', function () {
                const id = $(this).data('id');
                if (confirm('Are you sure you want to delete this announcement?')) {
                    $.ajax({
                        url: `/manager/delete-announcement/${id}`,
                        type: 'DELETE',
                        success: function (result) {
                            alert('Announcement deleted successfully');
                            fetchAndDisplayAnnouncements();
                        },
                        error: function (err) {
                            alert('An error occurred while deleting the announcement.');
                        }
                    });
                }
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error fetching announcements:', textStatus, errorThrown);
            $('#errorModalBody').text('An error occurred while fetching announcements: ' + textStatus + ' - ' + errorThrown);
            $('#errorModal').modal('show');
        });
    }

    function fetchAndDisplayEvents(shelterId) {
        $.get(`/api/shelter-events/${shelterId}`, function (data) {
            const eventContainer = $('.event-container');
            eventContainer.empty(); // removes any existing events
            data.forEach(function (event) {
                const eventCard = `
                    <div class="card event-card mb-3">
                        <img class="card-img-top" src="${event.image_url || 'default-image-url.jpg'}" alt="Event image">
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text">${event.description}</p>
                            <p class="card-text"><small class="text-muted">Date: ${new Date(event.event_date).toLocaleString()}</small></p>
                            <button class="btn btn-secondary edit-event" data-id="${event.event_id}" data-title="${event.title}" data-description="${event.description}" data-date="${new Date(event.event_date).toISOString().slice(0, 16)}" data-image="${event.image_url}">Edit Event</button>
                            <button class="btn btn-secondary view-rsvp-list" data-id="${event.event_id}">View RSVP List</button>
                        </div>
                    </div>`;
                eventContainer.append(eventCard);
            });

            // event handler for edit buttons
            $('.edit-event').on('click', function () {
                const id = $(this).data('id');
                const title = $(this).data('title');
                const description = $(this).data('description');
                const date = $(this).data('date');
                const image = $(this).data('image');
                openEditEventModal(id, title, description, date, image);
            });

            //  event handler for View RSVP List buttons
            $('.view-rsvp-list').on('click', function () {
                console.log('View RSVP List button clicked');
                const eventId = $(this).data('id');

                // Fetch RSVP list for the event
                $.get(`/events/${eventId}/rsvp/list`, function (data) {
                    console.log('RSVP List Data:', data); // Debugging log
                    const rsvpUserList = $('#rsvpUserList');
                    rsvpUserList.empty(); // removes existing list

                    // Populate the modal with the list of users
                    data.users.forEach(function (user) {
                        const listItem = `<li>${user}</li>`;
                        rsvpUserList.append(listItem);
                    });

                    // Show the RSVP List Modal
                    $('#rsvpListModal').modal('show');
                }).fail(function () {
                    $('#errorModalBody').text('An error occurred while fetching RSVP list.');
                    $('#errorModal').modal('show');
                });
            });

            //  event handler for delete buttons
            $('.delete-event').on('click', function () {
                const id = $(this).data('id');
                if (confirm('Are you sure you want to delete this event?')) {
                    $.ajax({
                        url: `/manager/delete-event/${id}`,
                        type: 'DELETE',
                        success: function (result) {
                            alert('Event deleted successfully');
                            fetchAndDisplayEvents(shelterId); // Refresh the events list
                        },
                        error: function (err) {
                            alert('An error occurred while deleting the event.');
                        }
                    });
                }
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error fetching events:', textStatus, errorThrown);
            $('#errorModalBody').text('An error occurred while fetching events: ' + textStatus + ' - ' + errorThrown);
            $('#errorModal').modal('show');
        });
    }

    function openEditEventModal(event_id, title, description, event_date, image_url) {
        $('#editEventId').val(event_id);
        $('#editEventTitle').val(title);
        $('#editEventDescription').val(description);
        $('#editEventDate').val(event_date);
        $('#editEventImageUrl').val(image_url);
        $('#editEventModal').modal('show');
    }

    $('#editEventForm').on('submit', function (event) {
        event.preventDefault();
        const formData = $(this).serialize();
        $.ajax({
            type: 'PUT',
            url: '/api/update-event',
            data: formData,
            success: function (response) {
                $('#editEventModal').modal('hide');
                fetchAndDisplayEvents(shelterId); // Refresh the events list
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error updating event:', textStatus, errorThrown);
                $('#errorModalBody').text('An error occurred while updating the event: ' + textStatus + ' - ' + errorThrown);
                $('#errorModal').modal('show');
            }
        });
    });

    // Handle Create Shelter form submission
    $('#create-shelter-form').on('submit', function (e) {
        e.preventDefault();

        const shelterName = $('#shelter-name').val();
        const shelterManagerEmail = $('#shelter-manager-email').val();
        const shelterLocation = $('#shelter-location').val();

        $.post('/admin/create-shelter', {
            shelterName,
            shelterManagerEmail,
            shelterLocation
        }, function (response) {
            if (response.success) {
                $('#createShelterModal').modal('hide');
                alert('Shelter created successfully');
            } else {
                $('#errorModalBody').text(response.error);
                $('#errorModal').modal('show');
            }
        }).fail(function () {
            $('#errorModalBody').text('An error occurred while creating the shelter.');
            $('#errorModal').modal('show');
        });
    });

    // Fetch and populate shelter list in the edit manager modal
    $('#editShelterManagerModal').on('show.bs.modal', function () {
        $.get('/admin/shelters', function (data) {
            const shelterSelect = $('#shelter-select');
            shelterSelect.empty();
            data.shelters.forEach(function (shelter) {
                shelterSelect.append(new Option(shelter.shelter_name, shelter.shelter_id));
            });
        }).fail(function () {
            $('#errorModalBody').text('An error occurred while fetching the shelter list.');
            $('#errorModal').modal('show');
        });
    });

    // Handle Edit Shelter Manager form submission
    $('#edit-shelter-manager-form').on('submit', function (e) {
        e.preventDefault();

        const shelterId = $('#shelter-select').val();
        const newManagerEmail = $('#new-manager-email').val();

        $.post('/admin/edit-shelter-manager', { shelterId, newManagerEmail }, function (response) {
            if (response.success) {
                $('#editShelterManagerModal').modal('hide');
                alert('Shelter manager updated successfully');
            } else {
                $('#errorModalBody').text(response.error);
                $('#errorModal').modal('show');
            }
        }).fail(function () {
            $('#errorModalBody').text('An error occurred while updating the shelter manager.');
            $('#errorModal').modal('show');
        });
    });

    // Handle Create Announcement form submission
    $('#create-announcement-form').on('submit', function (e) {
        e.preventDefault();

        const title = $('#announcement-title').val();
        const description = $('#announcement-description').val();

        $.post('/manager/create-announcement', { title, description }, function (response) {
            if (response.success) {
                $('#createAnnouncementModal').modal('hide');
                alert('Announcement created successfully');
                fetchAndDisplayAnnouncements();  // fetch an display the announcements
            } else {
                $('#errorModalBody').text(response.error);
                $('#errorModal').modal('show');
            }
        }).fail(function () {
            $('#errorModalBody').text('An error occurred while creating the announcement.');
            $('#errorModal').modal('show');
        });
    });

    // Handle the form submission for editing an announcement
    $('#edit-announcement-form').on('submit', function (event) {
        event.preventDefault();

        const id = $('#edit-announcement-id').val();
        const title = $('#edit-announcement-title').val();
        const description = $('#edit-announcement-description').val();

        fetch(`/manager/edit-announcement/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Announcement updated successfully!');
                    $('#editAnnouncementModal').modal('hide');
                    fetchAndDisplayAnnouncements(); // Refresh the announcements list
                } else {
                    alert('Error updating announcement: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error updating announcement: ' + error.message);
            });
    });

    let shelterId;

    // Fetch the user's shelter ID when the page loads
    $.get('/manager/get-shelter-id', function (response) {
        if (response.success) {
            shelterId = response.shelterId;
            fetchAndDisplayPets(shelterId);
        } else {
            $('#errorModalBody').text(response.error);
            $('#errorModal').modal('show');
        }
    });

    function fetchAndDisplayPets(shelterId) {
        $.get('/manager/get-pets', { shelter_id: shelterId }, function (response) {
            if (response.success) {
                const pets = response.pets;
                const petContainer = $('.pet-container');
                petContainer.empty(); // removes the container

                pets.forEach(pet => {
                    const petCard = `
                        <div class="card" data-pet-id="${pet.pet_id}">
                            <img class="card-img-top" src="${pet.image_url || 'default-image-url.jpg'}" alt="${pet.name}">
                            <div class="card-body">
                                <h5 class="card-title">${pet.name}</h5>
                                <p class="card-text">
                                    <strong>Type:</strong> ${pet.type}<br>
                                    <strong>Gender:</strong> ${pet.gender}<br>
                                    <strong>Age:</strong> ${pet.age}<br>
                                    <strong>Breed:</strong> ${pet.breed}<br>
                                    <strong>Desexed:</strong> ${pet.desexed}
                                </p>
                                <button class="btn btn-warning edit-pet" data-toggle="modal" data-target="#editPetModal" data-pet='${JSON.stringify(pet)}'>Edit Details</button>
                                <button class="btn btn-danger delete-pet">Delete</button>
                            </div>
                        </div>
                    `;
                    petContainer.append(petCard);
                });
            } else {
                $('#errorModalBody').text(response.message);
                $('#errorModal').modal('show');
            }
        }).fail(function (xhr, status, error) {
            console.error('Error fetching pets:', status, error);
            $('#errorModalBody').text('An error occurred while fetching pets: ' + error);
            $('#errorModal').modal('show');
        });
    }

    // Handle Create Event form submission
    $('#create-event-form').on('submit', function (e) {
        e.preventDefault();

        // Ensure that shelterId is retrieved before proceeding
        if (!shelterId) {
            $('#errorModalBody').text('Failed to retrieve shelter ID.');
            $('#errorModal').modal('show');
            return;
        }

        const title = $('#event-title').val();
        const description = $('#event-description').val();
        const eventDate = $('#event-date').val();
        const imageUrl = $('#event-image-url').val();

        $.post('/manager/create-event', { title, description, event_date: eventDate, image_url: imageUrl, shelter_id: shelterId }, function (response) {
            if (response.success) {
                $('#createEventModal').modal('hide');
                alert('Event created successfully');
                fetchAndDisplayEvents(shelterId);
            } else {
                $('#errorModalBody').text(response.error);
                $('#errorModal').modal('show');
            }
        }).fail(function (xhr, status, error) {
            console.error('Error:', status, error);
            $('#errorModalBody').text('An error occurred while creating the event: ' + error);
            $('#errorModal').modal('show');
        });
    });

    // Function to open the modal and populate shelter_id
    $('#addPetModal').on('show.bs.modal', function (event) {
        var modal = $(this);
        modal.find('#shelterId').val(shelterId);
    });

    // Handle form submission
    $('#addPetForm').submit(function (event) {
        event.preventDefault();

        var formData = {
            name: $('#petName').val(),
            type: $('#petType').val(),
            gender: $('#petGender').val(),
            age: $('#petAge').val(),
            breed: $('#petBreed').val(),
            desexed: $('#petDesexed').val(),
            image_url: $('#petImageUrl').val(),
            shelter_id: $('#shelterId').val()
        };

        console.log('Submitting form data:', formData); // log

        $.ajax({
            type: 'POST',
            url: '/api/add-pet-to-adoption',
            data: formData,
            success: function (response) {
                console.log('Server response:', response);
                if (response.success) {
                    $('#addPetModal').modal('hide'); // Hide the modal
                    alert('Pet successfully added!');
                    fetchAndDisplayPets();
                } else {
                    alert('Failed to add pet: ' + response.message);
                }
            },
            error: function (error) {
                console.error('Error adding pet:', error);
                alert('Failed to add pet');
            }
        });
    });

    $(document).on('click', '.edit-pet', function () {
        const pet = $(this).data('pet');
        $('#editPetId').val(pet.pet_id);
        $('#editPetName').val(pet.name);
        $('#editPetType').val(pet.type);
        $('#editPetGender').val(pet.gender);
        $('#editPetAge').val(pet.age);
        $('#editPetBreed').val(pet.breed);
        $('#editPetDesexed').val(pet.desexed);
        $('#editPetImageUrl').val(pet.image_url);
    });

    $('#editPetForm').submit(function (event) {
        event.preventDefault();

        const formData = {
            pet_id: $('#editPetId').val(),
            name: $('#editPetName').val(),
            type: $('#editPetType').val(),
            gender: $('#editPetGender').val(),
            age: $('#editPetAge').val(),
            breed: $('#editPetBreed').val(),
            desexed: $('#editPetDesexed').val(),
            image_url: $('#editPetImageUrl').val()
        };

        $.ajax({
            type: 'POST',
            url: '/api/edit-pet',
            data: formData,
            success: function (response) {
                if (response.success) {
                    $('#editPetModal').modal('hide'); // Hide the modal
                    alert('Pet details successfully updated!');
                    fetchAndDisplayPets(shelterId); // Refresh the pet list
                } else {
                    alert('Failed to update pet details: ' + response.message);
                }
            },
            error: function (error) {
                console.error('Error updating pet details:', error);
                alert('Failed to update pet details');
            }
        });
    });

    $(document).on('click', '.delete-pet', function () {
        const petId = $(this).closest('.card').data('pet-id');
        if (confirm('Are you sure you want to delete this pet?')) {
            $.ajax({
                type: 'POST',
                url: '/api/delete-pet',
                data: { pet_id: petId },
                success: function (response) {
                    if (response.success) {
                        alert('Pet successfully deleted!');
                        fetchAndDisplayPets(shelterId); // Refresh the pet list
                    } else {
                        alert('Failed to delete pet: ' + response.message);
                    }
                },
                error: function (error) {
                    console.error('Error deleting pet:', error);
                    alert('Failed to delete pet');
                }
            });
        }
    });

    //  event handler for "View RSVP List" button
    $('.view-rsvp-list').on('click', function () {
        const eventId = $(this).data('id');

        // Fetch RSVP list for the event
        $.get(`/events/${eventId}/rsvp/list`, function (data) {
            const rsvpUserList = $('#rsvpUserList');
            rsvpUserList.empty(); // removes existing list

            // Populate the modal with the list of users
            data.users.forEach(function (user) {
                const listItem = `<li>${user.email}</li>`;
                rsvpUserList.append(listItem);
            });

            // Show the RSVP List Modal
            $('#rsvpListModal').modal('show');
        }).fail(function () {
            $('#errorModalBody').text('An error occurred while fetching RSVP list.');
            $('#errorModal').modal('show');
        });
    });

    // Sidebar functionality
    $('.btn-hide-sidebar').on('click', function () {
        $('.sidebar').removeClass('visible');
    });

    $('.hover-area, .arrow-icon').on('mouseenter click', function () {
        $('.sidebar').addClass('visible');
    });

    $(document).on('click', function (event) {
        if (!$(event.target).closest('.sidebar, .hover-area, .arrow-icon').length) {
            $('.sidebar').removeClass('visible');
        }
    });

    // Swipe functionality for sidebar
    let touchstartX = 0;
    let touchendX = 0;

    function checkDirection() {
        if (touchendX > touchstartX) {
            $('.sidebar').addClass('visible');
        } else if (touchendX < touchstartX) {
            $('.sidebar').removeClass('visible');
        }
    }

    document.addEventListener('touchstart', function (e) {
        touchstartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', function (e) {
        touchendX = e.changedTouches[0].screenX;
        checkDirection();
    }, false);
});