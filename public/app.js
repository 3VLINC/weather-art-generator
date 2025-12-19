// Main application logic
class WeatherArtApp {
    constructor() {
        this.artGenerator = new WeatherArtGenerator();
        this.currentWeatherData = null;
        this.currentSeed = null;
        this.currentColorVariations = null;
        this.currentArtworkDataUrl = null;
        this.inactivityTimer = null;
        this.initializeEventListeners();
        this.setupInactivityTimer();
    }

    initializeEventListeners() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generateArtwork());
        document.getElementById('generateAgainBtn').addEventListener('click', () => this.generateAgain());
        document.getElementById('acceptGiftBtn').addEventListener('click', () => this.showEmailForm());
        document.getElementById('submitEmailBtn').addEventListener('click', () => this.sendArtwork());
        document.getElementById('logoBtn').addEventListener('click', () => this.returnToMainPage());
        
        // Close email form when clicking on overlay
        const overlay = document.getElementById('emailOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hideEmailForm());
        }
        
        // Prevent clicks inside email form from closing it
        const emailForm = document.getElementById('emailForm');
        if (emailForm) {
            emailForm.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    async generateArtwork() {
        // Trigger fade-out of intro elements
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('intro-fade');
        }

        this.showLoading(true);
        this.hideMessage();
        
        const startTime = Date.now();
        
        try {
            // Fetch weather data
            const weatherResponse = await fetch('/api/weather');
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            this.currentWeatherData = weatherData;
            
            // Display weather information
            this.displayWeatherInfo(weatherData);
            
            // Generate artwork on server (SVG first, then rasterized)
            console.log('Requesting server-side artwork generation...');
            const artworkResponse = await fetch('/api/generate-artwork', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ weatherData: weatherData })
            });
            
            if (!artworkResponse.ok) {
                throw new Error('Failed to generate artwork');
            }
            
            const artworkData = await artworkResponse.json();
            console.log('Artwork received from server:', {
                hasArtworkData: !!artworkData.artworkDataUrl,
                hasSeed: !!artworkData.seed,
                hasColorVariations: !!artworkData.colorVariations
            });
            
            // Store seed and colorVariations for email sending
            this.currentSeed = artworkData.seed;
            this.currentColorVariations = artworkData.colorVariations;
            
            // Display the PNG artwork received from server
            this.displayServerArtwork(artworkData.artworkDataUrl);
            
            // Wait for fade-out animation to complete, then animate main section up
            setTimeout(() => {
                // Animate logo and headers up to top as one unit - NO LAYOUT CHANGES!
                const mainSection = document.querySelector('.main-section');
                if (mainSection) {
                    mainSection.classList.add('shift-up');
                }
                
                // Wait for upward animation to COMPLETELY finish, then show artwork section
                setTimeout(() => {
                    // Show artwork section with smooth fade-in ONLY after main-section is settled
                    const artworkSection = document.querySelector('.artwork-section');
                    if (artworkSection) {
                        artworkSection.classList.add('visible');
                    }
                    
                    // Show individual elements
                    document.getElementById('artwork-container').style.display = 'block';
                    document.getElementById('weatherSidebar').style.display = 'flex';
                    document.getElementById('actionButtons').style.display = 'flex';
                    document.getElementById('emailForm').style.display = 'none';
                }, 1000); // Wait for upward animation (0.8s) + buffer to ensure completion
            }, 1200); // Wait for fade-out animation (1.0s) plus small buffer
            
        } catch (error) {
            console.error('Error generating artwork:', error);
            this.showMessage('Error generating artwork. Please try again.', 'error');
        } finally {
            // Ensure loading shows for at least 1 second
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            
            setTimeout(() => {
                this.showLoading(false);
            }, remainingTime);
        }
    }

    async generateAgain() {
        console.log('Generate Again clicked');
        this.showLoading(true);
        this.hideMessage();
        
        const startTime = Date.now();
        
        try {
            // Fetch fresh weather data
            console.log('Fetching fresh weather data...');
            const response = await fetch('/api/weather');
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await response.json();
            console.log('Fresh weather data received:', weatherData);
            this.currentWeatherData = weatherData;
            
            // Display updated weather information
            this.displayWeatherInfo(weatherData);
            
            // Generate artwork on server (SVG first, then rasterized)
            console.log('Requesting server-side artwork generation...');
            const artworkResponse = await fetch('/api/generate-artwork', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ weatherData: weatherData })
            });
            
            if (!artworkResponse.ok) {
                throw new Error('Failed to generate artwork');
            }
            
            const artworkData = await artworkResponse.json();
            console.log('Artwork received from server:', {
                hasArtworkData: !!artworkData.artworkDataUrl,
                hasSeed: !!artworkData.seed,
                hasColorVariations: !!artworkData.colorVariations
            });
            
            // Store seed and colorVariations for email sending
            this.currentSeed = artworkData.seed;
            this.currentColorVariations = artworkData.colorVariations;
            
            // Display the PNG artwork received from server
            this.displayServerArtwork(artworkData.artworkDataUrl);
            
            // Ensure artwork section is visible and elements are shown
            const artworkSection = document.querySelector('.artwork-section');
            if (artworkSection) {
                artworkSection.classList.add('visible');
            }
            
            document.getElementById('artwork-container').style.display = 'block';
            document.getElementById('weatherSidebar').style.display = 'flex';
            document.getElementById('actionButtons').style.display = 'flex';
            document.getElementById('emailForm').style.display = 'none';
            
            console.log('New artwork generation complete');
            
        } catch (error) {
            console.error('Error generating artwork:', error);
            this.showMessage('Error generating artwork. Please try again.', 'error');
        } finally {
            // Ensure loading shows for at least 1 second
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            
            setTimeout(() => {
                this.showLoading(false);
            }, remainingTime);
        }
    }

    displayWeatherInfo(weatherData) {
        // Update Ottawa weather card
        const ottawaWeather = document.getElementById('ottawaWeather');
        ottawaWeather.innerHTML = `
            <p><strong>気温 | Temperature | Température</strong> ${weatherData.ottawa.temperature}°C</p>
            <p><strong>湿度 |Humidity | Humidité</strong> ${weatherData.ottawa.humidity}%</p>
            <p><strong>気圧 | Pressure | Pression</strong> ${weatherData.ottawa.pressure} hPa</p>
            <p><strong>風 | Wind | Vent</strong> ${weatherData.ottawa.windSpeed} m/s</p>
            <p><strong>天気状況 | Conditions</strong> ${weatherData.ottawa.description}</p>
        `;
        
        // Update Tokyo weather card
        const tokyoWeather = document.getElementById('tokyoWeather');
        tokyoWeather.innerHTML = `
            <p><strong>気温 | Temperature | Température</strong> ${weatherData.tokyo.temperature}°C</p>
            <p><strong>湿度 |Humidity | Humidité</strong> ${weatherData.tokyo.humidity}%</p>
            <p><strong>気圧 | Pressure | Pression</strong> ${weatherData.tokyo.pressure} hPa</p>
            <p><strong>風 | Wind | Vent</strong> ${weatherData.tokyo.windSpeed} m/s</p>
            <p><strong>天気状況 | Conditions</strong> ${weatherData.tokyo.description}</p>
        `;
    }

    showEmailForm() {
        const overlay = document.getElementById('emailOverlay');
        const emailForm = document.getElementById('emailForm');
        
        if (overlay) {
            overlay.style.display = 'block';
            // Trigger fade-in after display
            setTimeout(() => {
                overlay.classList.add('visible');
            }, 10);
        }
        
        if (emailForm) {
            emailForm.style.display = 'block';
            // Trigger fade-in after display
            setTimeout(() => {
                emailForm.classList.add('visible');
                document.getElementById('emailInput').focus();
            }, 10);
        }
    }

    hideEmailForm() {
        const overlay = document.getElementById('emailOverlay');
        const emailForm = document.getElementById('emailForm');
        
        // Fade out
        if (overlay) {
            overlay.classList.remove('visible');
        }
        if (emailForm) {
            emailForm.classList.remove('visible');
        }
        
        // Hide after fade completes
        setTimeout(() => {
            if (overlay) {
                overlay.style.display = 'none';
            }
            if (emailForm) {
                emailForm.style.display = 'none';
            }
        }, 300); // Match CSS transition duration
    }

    async sendArtwork() {
        const emailInput = document.getElementById('emailInput');
        const email = emailInput.value.trim();
        
        if (!email || !this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            // Use the artwork data we received from server
            const artworkDataUrl = this.currentArtworkDataUrl;
            
            if (!artworkDataUrl) {
                throw new Error('No artwork data available');
            }
            
            console.log('Sending artwork data:', {
                hasArtworkData: !!artworkDataUrl,
                hasSeed: !!this.currentSeed,
                hasColorVariations: !!this.currentColorVariations
            });
            
            console.log('Sending email request...');
            const response = await fetch('/api/send-artwork', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    artworkDataUrl: artworkDataUrl,
                    weatherData: this.currentWeatherData,
                    seed: this.currentSeed,
                    colorVariations: this.currentColorVariations
                })
            });

            console.log('Response status:', response.status, response.statusText);
            
            let result;
            try {
                result = await response.json();
                console.log('Response data:', result);
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', jsonError);
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error('Invalid response from server');
            }
            
            if (response.ok) {
                console.log('✅ Email sent successfully!');
                this.showMessage('Artwork sent successfully! Check your email.', 'success');
                emailInput.value = '';
                this.hideEmailForm();
            } else {
                const errorMsg = result.error || 'Failed to send artwork';
                console.error('❌ Server error:', errorMsg);
                this.showMessage(errorMsg, 'error');
            }
            
        } catch (error) {
            console.error('❌ Error sending artwork:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showMessage(`Error sending artwork: ${error.message}. Check console for details.`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading(show) {
        // Show/hide the artwork loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
        
        // Disable buttons during loading
        document.getElementById('generateBtn').disabled = show;
        document.getElementById('generateAgainBtn').disabled = show;
        document.getElementById('acceptGiftBtn').disabled = show;
        document.getElementById('submitEmailBtn').disabled = show;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        // Show message with fade-in
        messageEl.style.display = 'block';
        // Trigger fade-in by adding visible class after display is set
        setTimeout(() => {
            messageEl.classList.add('visible');
        }, 10);
        
        // Auto-hide after 5 seconds with fade-out
        setTimeout(() => {
            this.hideMessage();
        }, 5000);
    }

    hideMessage() {
        const messageEl = document.getElementById('message');
        // Remove visible class to trigger fade-out
        messageEl.classList.remove('visible');
        
        // Hide after fade-out completes
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 500); // Match CSS transition duration
    }

    setupInactivityTimer() {
        // Reset timer on any user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetInactivityTimer();
            }, true);
        });
    }

    resetInactivityTimer() {
        // Clear existing timer
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        // Set new timer for 5 minutes (300,000 ms)
        this.inactivityTimer = setTimeout(() => {
            this.returnToMainPage();
        }, 300000); // 5 minutes
    }

    returnToMainPage() {
        // Hide artwork section and show initial UI
        document.getElementById('artwork-container').style.display = 'none';
        document.getElementById('weatherSidebar').style.display = 'none';
        document.getElementById('actionButtons').style.display = 'none';
        this.hideEmailForm();
        
        // Hide artwork section with smooth fade-out
        const artworkSection = document.querySelector('.artwork-section');
        if (artworkSection) {
            artworkSection.classList.remove('visible');
        }
        
        // Remove intro-fade class to show initial elements
        const container = document.querySelector('.container');
        if (container) {
            container.classList.remove('intro-fade');
        }
        
        // Remove shift-up class from main section
        const mainSection = document.querySelector('.main-section');
        if (mainSection) {
            mainSection.classList.remove('shift-up');
        }
        
        // No layout changes to remove - keeping it simple!
        
        // Clear any messages
        this.hideMessage();
        
        // Reset the art generator
        this.artGenerator = new WeatherArtGenerator();
        this.currentWeatherData = null;
        this.currentSeed = null;
        this.currentColorVariations = null;
        this.currentArtworkDataUrl = null;
        
        console.log('Returned to main page due to inactivity');
    }
    
    displayServerArtwork(pngDataUrl) {
        const container = document.getElementById('artwork-sketch');
        if (!container) {
            console.error('artwork-sketch container not found');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Calculate display size
        const maxAvailableWidth = Math.min(800, window.innerWidth - 100);
        const maxAvailableHeight = Math.max(240, window.innerHeight - 240);
        
        let displayWidth = Math.max(240, maxAvailableWidth);
        let displayHeight = Math.round(displayWidth * 5 / 4); // 4:5 ratio (1080:1350)
        
        if (displayHeight > maxAvailableHeight) {
            displayHeight = maxAvailableHeight;
            displayWidth = Math.round(displayHeight * 4 / 5);
        }
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto'; // Center horizontally
        canvas.style.padding = '0';
        canvas.style.border = 'none';
        canvas.style.outline = 'none';
        canvas.style.boxSizing = 'border-box';
        canvas.style.verticalAlign = 'top';
        
        const ctx = canvas.getContext('2d');
        
        // Load the PNG and draw it scaled to display size
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
            console.log('Server artwork displayed successfully');
        };
        img.onerror = (error) => {
            console.error('Failed to load server artwork:', error);
            ctx.fillStyle = '#f0f5fa';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading artwork', displayWidth / 2, displayHeight / 2);
        };
        
        img.src = pngDataUrl;
        container.appendChild(canvas);
        
        // Store artwork data for email
        this.currentArtworkDataUrl = pngDataUrl;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherArtApp();
});
