document.addEventListener('DOMContentLoaded', function () {
    // Fetch and load the header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            const head = document.head;
            const link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = "/stylesheets/header.css";
            head.appendChild(link);

            // After the header is loaded, check the authentication status and page
            checkAuthStatus();
            adjustNavLinks();

            // Close the hamburger menu if the user clicks outside of it
            document.addEventListener('click', function (event) {
                const navbar = document.querySelector('.navbar');
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbarCollapse = document.getElementById('navbarNav');
                const isClickInsideNavbar = navbar.contains(event.target);

                if (!isClickInsideNavbar && navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            });
        });

    function checkAuthStatus() {
        // Check authentication status
        fetch('/auth/status')
            .then(response => response.json())
            .then(data => {
                const isLoggedIn = data.authenticated;

                const profileItem = document.getElementById('profile-item');
                const logoutItem = document.getElementById('logout-item');
                const loginItem = document.getElementById('login-item');
                const signupItem = document.getElementById('signup-item');

                if (isLoggedIn) {
                    profileItem.style.display = 'block';
                    logoutItem.style.display = 'block';
                    loginItem.style.display = 'none';
                    signupItem.style.display = 'none';
                } else {
                    profileItem.style.display = 'none';
                    logoutItem.style.display = 'none';
                    loginItem.style.display = 'block';
                    signupItem.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching authentication status:', error));
    }

    function adjustNavLinks() {
        const currentPage = window.location.pathname;
        const profileItem = document.getElementById('profile-item');
        if (currentPage.includes('profile-page.html')) {
            profileItem.querySelector('a').innerText = 'Home';
            profileItem.querySelector('a').href = '/';
        }
    }
});
