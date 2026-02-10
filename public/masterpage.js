// Define the custom header element with updated navigation
class GritlabHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <div class="container">
          <div class="logo-container">
            <img src="Assets/images/logo.png" alt="GRITLab Africa Logo" class="logo-img">
            <span class="app-name">GRIT Lab Africa</span>
          </div>
        
          <button type="button" class="mobile-toggle"><i class="fa-solid fa-bars"></i></button>
          <nav>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="about.html">About GLA</a></li>
              <li><a href="Apply.html">Apply</a></li>
              <li><a href="OurTeam.html">Our Team</a></li>
              <li><a href="Awards&Testimonials.html">Awards & Testimonials</a></li>
              <li><a href="Media.html">Media</a></li>
              <li><a href="Publications.html">Publications</a></li>
              <li><a href="Supporters.html">Supporters</a></li>
            </ul>
          </nav>
        </div>
      </header>
    `;

    this.initMobileMenu();
    this.setActiveLink();
    this.initDropdowns();
  }

  initMobileMenu() {
    const mobileToggle = this.querySelector('.mobile-toggle');
    const nav = this.querySelector('nav');

    if (mobileToggle) {
      mobileToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        nav.classList.toggle('active');
        
        const icon = this.querySelector('i');
        if (nav.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) ) {
          nav.classList.remove('active');
          const icon = mobileToggle.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });
    }
  }

  initDropdowns() {
    const dropdowns = this.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      const link = dropdown.querySelector('a');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.toggle('active');
      });
    });

    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!e.target.matches('.dropdown a')) {
        this.querySelectorAll('.dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  }

  setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    this.querySelectorAll('nav a').forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}


// Define the custom footer element
class GritlabFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer id="contact">
        <div class="container">
          <div class="footer-content">
            <img src="Assets/images/logo.png" alt="GRITLab Africa Logo" class="logo-img" style="max-height: 50px;">
            <div class="footer-links">
              <h4>Links</h4>
              <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="apply.html">Apply</a></li>
                <li><a href="OurTeam.html">GLA Team</a></li>
              </ul>
            </div>
            <div class="footer-contact">
              <h4>Contact</h4>
              <p>Email: info@gritlabafrica.org</p>
            </div>
            <div class="footer-social">
              <h4>Follow Us</h4>
              <div class="social-icons">
                <a href="https://www.facebook.com/" target="_blank" aria-label="Facebook">
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/kingsman_academic_official/?hl=en" target="_blank" aria-label="Instagram">
                  <i class="fab fa-instagram"></i>
                </a>
                <a href="https://www.linkedin.com/company/grit-lab-africa/?originalSubdomain=za" target="_blank" aria-label="LinkedIn">
                  <i class="fab fa-linkedin-in"></i>
                </a>
                <a href="https://www.youtube.com/" target="_blank" aria-label="YouTube">
                  <i class="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
          <div class="copyright">
            <p>GRITLab Africa Copyright © 2025 All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
  }
}

// Register the custom elements
customElements.define('gritlab-header', GritlabHeader);
customElements.define('gritlab-footer', GritlabFooter);

// Load intro animation if on home page
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const introOverlay = document.createElement('div');
    introOverlay.className = 'intro-overlay';
    introOverlay.innerHTML = `
      <img src="Assets/images/logo.png" alt="GRITLab Africa Logo" class="intro-text" style="max-height: 70px;">
      <span class="app-name">GRITLab Africa</span>
    `;
    document.body.prepend(introOverlay);
    
    setTimeout(() => {
      introOverlay.classList.add('hide');
      setTimeout(() => {
        introOverlay.remove();
      }, 500);
    }, 1000);
  }
});

