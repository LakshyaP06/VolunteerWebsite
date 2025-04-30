document.addEventListener('DOMContentLoaded', function () {
    // Fetch and load the footer
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
            const head = document.head;
            const link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = "/stylesheets/footer.css";
            head.appendChild(link);
        });

    // Helper function to render announcements
    function renderAnnouncements(announcements) {
        const announcementsContainer = document.getElementById('announcements');
        announcementsContainer.innerHTML = ''; // Clear existing announcements

        announcements.forEach(announcement => {
            const shelter = announcement.shelter_name ? announcement.shelter_name : 'Unknown Shelter';

            const announcementCard = `
                <div class="announcement">
                    <h5 class="announcement-title">${announcement.title}</h5>
                    <p class="announcement-description">${announcement.description}</p>
                    <p class="announcement-time"><small>Posted on ${new Date(announcement.time).toLocaleString()}</small></p>
                    <p class="announcement-shelter"><small>Shelter: ${shelter}</small></p>
                </div>`;
            announcementsContainer.innerHTML += announcementCard;
        });
    }

    // Fetch and render announcements
    function fetchAndRenderAnnouncements(shelterName = '') {
        const url = shelterName ? `/announcements?shelterName=${shelterName}` : '/announcements';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                renderAnnouncements(data.announcements);
            })
            .catch(error => console.error('Error fetching announcements:', error));
    }

    document.getElementById('search-button').addEventListener('click', function () {
        const searchInput = document.getElementById('search-input').value;
        fetchAndRenderAnnouncements(searchInput);
    });

    fetchAndRenderAnnouncements();

    let isLoggedIn = false; // Default to not logged in

    fetch('/auth/status')
        .then(response => response.json())
        .then(data => {
            isLoggedIn = data.authenticated;
            loadEvents(); // Load events after checking authentication status
        })
        .catch(error => console.error('Error fetching authentication status:', error));

    let events = [];
    let eventsPerPage = 3;
    let currentPage = 1;

    // Function to load events from the server
    function loadEvents() {
        fetch('/events')
            .then(response => response.json())
            .then(data => {
                events = data;
                displayEvents(); // Display events after loading
            })
            .catch(error => console.error('Error fetching events:', error));
    }

    // Function to display events on the page
    function displayEvents() {
        const upcomingEventsContainer = document.getElementById('upcoming-events');
        const currentDate = new Date();
        const start = (currentPage - 1) * eventsPerPage;
        const end = start + eventsPerPage;
        const eventsToDisplay = events.slice(start, end);

        eventsToDisplay.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.classList.add('col-lg-4', 'col-md-6', 'mb-4', 'event');

            const eventDate = new Date(event.event_date);
            const formattedEventDate = eventDate.toLocaleDateString('en-AU', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            let rsvpButtonText = isLoggedIn ? 'RSVP' : 'Login to RSVP for Event';
            const rsvpButton = document.createElement('button');
            rsvpButton.classList.add('btn', 'btn-primary', 'rsvp-button');
            rsvpButton.setAttribute('data-event-id', event.event_id);
            rsvpButton.textContent = rsvpButtonText;

            if (isLoggedIn) {
                fetch(`/events/${event.event_id}/rsvp/status`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.rsvped) {
                            rsvpButton.textContent = 'Cancel RSVP';
                        }
                    })
                    .catch(error => console.error('Error fetching RSVP status:', error));
            } else {
                rsvpButton.disabled = true;
            }

            rsvpButton.addEventListener('click', function () {
                if (!isLoggedIn) {
                    alert('Please log in to RSVP for this event.');
                    return;
                }

                const isCanceling = this.textContent === 'Cancel RSVP';
                const eventId = this.getAttribute('data-event-id');
                const endpoint = isCanceling ? `/events/${eventId}/rsvp/cancel` : `/events/${eventId}/rsvp`;

                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error RSVPing for event:', data.error);
                        alert('Error RSVPing for the event. Please try again later.');
                    } else if (data.message === 'RSVP cancelled') {
                        alert('RSVP cancelled.');
                        this.textContent = 'RSVP';
                    } else {
                        alert('Successfully RSVPed for the event.');
                        this.textContent = 'Cancel RSVP';
                    }
                })
                .catch(error => console.error('Error RSVPing for event:', error));
            });

            eventElement.innerHTML = `
                <div class="card event-card">
                    <img src="${event.image_url}" class="card-img-top" alt="${event.title}">
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text">${event.description}</p>
                        </div>
                        <div class="mt-auto">
                            <p class="card-text"><small class="text-muted">Date: ${formattedEventDate}</small></p>
                        </div>
                    </div>
                </div>
            `;

            eventElement.querySelector('.card-body').appendChild(rsvpButton);
            upcomingEventsContainer.appendChild(eventElement);
        });

        const loadMoreButton = document.getElementById('load-more');
        if ((currentPage * eventsPerPage) >= events.length) {
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'block';
        }
    }

    document.getElementById('load-more').addEventListener('click', function () {
        currentPage++; // Increment the current page
        displayEvents(); // Call displayEvents to load more events
    });
});
