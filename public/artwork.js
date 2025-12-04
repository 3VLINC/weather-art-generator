// Weather Art Generator using p5.js
class WeatherArtGenerator {
    constructor() {
        this.canvas = null;
        this.weatherData = null;
        this.artworkData = null;
        this.svgData = null; // Store SVG content
        this.colorVariations = null; // Store color variations to reuse in high-res
        this.currentSeed = null; // Store seed to ensure consistency
    }

	// Initialize the p5.js sketch
	initSketch(weatherData) {
		console.log('initSketch called with weather data:', weatherData);
		this.weatherData = weatherData;
		
		// Remove existing sketch if any
		const existingSketch = document.getElementById('artwork-sketch');
		console.log('Existing sketch children:', existingSketch.children.length);
		if (existingSketch.firstChild) {
			existingSketch.removeChild(existingSketch.firstChild);
			console.log('Removed existing sketch');
		}
		
		// Clear any existing p5 instances
		if (this.currentP5Instance) {
			console.log('Removing existing p5 instance');
			this.currentP5Instance.remove();
			this.currentP5Instance = null;
		}

		// Small delay to ensure DOM is updated
		setTimeout(() => {
			console.log('Creating new sketch...');
			this.createNewSketch();
		}, 50);
	}
	
	createNewSketch() {
		// Calculate display size to fit viewport while maintaining 4:5 ratio (1080:1350)
		const maxAvailableWidth = Math.min(800, window.innerWidth - 100);
		const maxAvailableHeight = Math.max(240, window.innerHeight - 240); // leave room for UI
		
		let displayWidth = Math.max(240, maxAvailableWidth);
		let displayHeight = Math.round(displayWidth * 5 / 4); // 4:5 ratio (1080:1350)
		
		// If height is too tall, scale down based on height
		if (displayHeight > maxAvailableHeight) {
			displayHeight = maxAvailableHeight;
			displayWidth = Math.round(displayHeight * 4 / 5); // 4:5 ratio (1080:1350)
		}
		
		// Store display dimensions
		this.displayWidth = displayWidth;
		this.displayHeight = displayHeight;
		
		// Set up full resolution dimensions
		this.fullWidth = 1080;
		this.fullHeight = 1350;
		
		// Show placeholder while generating
		this.showGeneratingPlaceholder();
		
		// Generate SVG first, then convert to raster for display
		// Wait a bit to ensure p5.SVG is loaded
		setTimeout(() => {
			this.generateArtworkSVG();
		}, 100);
	}
	
	showGeneratingPlaceholder() {
		const container = document.getElementById('artwork-sketch');
		if (!container) return;
		
		container.innerHTML = '';
		const canvas = document.createElement('canvas');
		canvas.width = this.displayWidth;
		canvas.height = this.displayHeight;
		canvas.style.display = 'block';
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#f0f5fa';
		ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
		ctx.fillStyle = '#999';
		ctx.font = '18px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('Generating artwork...', this.displayWidth / 2, this.displayHeight / 2);
		container.appendChild(canvas);
	}

	generateArtworkSVG() {
		const { ottawa, tokyo } = this.weatherData;
		
		// Generate unique seed based on weather data
		this.currentSeed = this.createSeed(ottawa, tokyo);
		
		console.log('Generating artwork SVG with seed:', this.currentSeed);
		console.log('p5 available:', typeof p5 !== 'undefined');
		console.log('p5.SVG available:', typeof p5 !== 'undefined' && typeof p5.SVG !== 'undefined');
		
		// Store reference to this for use in p5 callbacks
		const self = this;
		
		// Check if p5.SVG is available - try multiple ways
		const hasSVG = typeof p5 !== 'undefined' && (
			typeof p5.SVG !== 'undefined' || 
			typeof SVG !== 'undefined' ||
			(typeof window !== 'undefined' && typeof window.SVG !== 'undefined')
		);
		
		console.log('SVG availability check:', {
			p5Available: typeof p5 !== 'undefined',
			p5SVG: typeof p5 !== 'undefined' && typeof p5.SVG !== 'undefined',
			SVGGlobal: typeof SVG !== 'undefined',
			windowSVG: typeof window !== 'undefined' && typeof window.SVG !== 'undefined',
			hasSVG: hasSVG
		});
		
		if (!hasSVG) {
			console.warn('⚠️ p5.SVG not available, will use raster canvas');
		}
		
		// Create a temporary p5 instance for SVG generation
		const tempP5 = new p5((p) => {
			p.setup = () => {
				console.log('p5 setup called');
				
				// Create SVG canvas at full resolution
				// p5.js-svg uses SVG as a constant (not a string)
				let isSVG = false;
				if (hasSVG) {
					try {
						// Try SVG constant (the correct way for p5.js-svg)
						// First check what SVG constant is available
						const SVG_RENDERER = typeof SVG !== 'undefined' ? SVG : 
						                   (typeof p.SVG !== 'undefined' ? p.SVG : 
						                   (typeof p5 !== 'undefined' && typeof p5.SVG !== 'undefined' ? p5.SVG : 'SVG'));
						
						console.log('Attempting to create SVG canvas with renderer:', SVG_RENDERER);
						p.createCanvas(self.fullWidth, self.fullHeight, SVG_RENDERER);
						
						// Check if it's actually an SVG
						isSVG = (p.canvas && p.canvas.elt && p.canvas.elt.tagName === 'svg');
						console.log('SVG canvas created:', isSVG, 'canvas type:', p.canvas ? p.canvas.elt.tagName : 'none');
						
						// If still not SVG, try as string
						if (!isSVG) {
							console.log('Trying SVG as string...');
							p.remove();
							p.createCanvas(self.fullWidth, self.fullHeight, 'SVG');
							isSVG = (p.canvas && p.canvas.elt && p.canvas.elt.tagName === 'svg');
							console.log('SVG canvas created (string):', isSVG, 'canvas type:', p.canvas ? p.canvas.elt.tagName : 'none');
						}
					} catch (e) {
						console.error('❌ Error creating SVG canvas:', e);
						console.error('Error message:', e.message);
						console.error('Error stack:', e.stack);
						// Fallback to raster
						p.createCanvas(self.fullWidth, self.fullHeight);
					}
				} else {
					console.warn('⚠️ p5.SVG not loaded, using raster canvas');
					console.warn('This means SVG files will not be generated!');
					p.createCanvas(self.fullWidth, self.fullHeight);
				}
				
				// Hide the canvas (we'll display the raster version)
				if (p.canvas && p.canvas.elt) {
					p.canvas.elt.style.display = 'none';
				}
				
				p.randomSeed(self.currentSeed);
				
				// Generate unique color variations for this piece
				// These consume the first 3 random numbers from the sequence
				self.colorVariations = {
					background: p.random(0.9, 1.1),
					saturation: p.random(0.8, 1.2),
					brightness: p.random(0.9, 1.1)
				};
				
				// Clear background with slight color variation
				const bgR = Math.floor(240 * self.colorVariations.background);
				const bgG = Math.floor(245 * self.colorVariations.background);
				const bgB = Math.floor(250 * self.colorVariations.background);
				
				// Set background - SVG handles this differently
				if (isSVG) {
					// SVG mode - use rect for background
					p.fill(bgR, bgG, bgB);
					p.noStroke();
					p.rect(0, 0, self.fullWidth, self.fullHeight);
				} else {
					// Raster fallback
					p.background(bgR, bgG, bgB);
				}
				
				// Generate artwork based on weather parameters (at full resolution)
				self.drawWeatherPatterns(p, ottawa, tokyo);
				self.drawTemperatureCurves(p, ottawa, tokyo);
				self.drawHumidityEffects(p, ottawa, tokyo);
				self.drawWindPatterns(p, ottawa, tokyo);
				self.drawUniqueElements(p, ottawa, tokyo);
				
				// Extract SVG content if SVG canvas
				if (isSVG && p.canvas && p.canvas.elt && p.canvas.elt.tagName === 'svg') {
					console.log('Extracting SVG content...');
					// Get SVG element and its content
					const svgElement = p.canvas.elt;
					// Set proper attributes
					svgElement.setAttribute('width', self.fullWidth);
					svgElement.setAttribute('height', self.fullHeight);
					svgElement.setAttribute('viewBox', `0 0 ${self.fullWidth} ${self.fullHeight}`);
					svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
					// Get SVG as string and store it IMMEDIATELY
					const svgString = svgElement.outerHTML;
					self.svgData = svgString; // Store as string
					console.log('✅ SVG data stored, length:', self.svgData.length);
					console.log('✅ SVG data type:', typeof self.svgData);
					console.log('✅ SVG data preview:', self.svgData.substring(0, 100));
					
					// Verify it's stored correctly
					if (!self.svgData || typeof self.svgData !== 'string') {
						console.error('❌ SVG data not stored correctly!');
					}
					
					// Convert SVG to PNG for display and email
					self.convertSVGtoPNG(svgElement).then(() => {
						console.log('SVG to PNG conversion complete, artworkData:', !!self.artworkData);
						
						// CRITICAL: Re-verify SVG data is still stored after conversion
						if (!self.svgData || typeof self.svgData !== 'string') {
							console.warn('⚠️ SVG data lost after conversion, restoring...');
							self.svgData = svgString;
							console.log('✅ SVG data restored, length:', self.svgData.length);
						}
						
						// Ensure artworkData is set
						if (self.artworkData) {
							// Display the raster image on the website
							self.displayRasterImage();
						} else {
							console.error('artworkData not set after SVG conversion');
							// Fallback: try to create raster version
							self.createRasterFallback(p);
						}
						
						// Remove the temporary p5 instance
						setTimeout(() => {
							p.remove();
						}, 100);
					}).catch((error) => {
						console.error('Error converting SVG to PNG:', error);
						// Ensure SVG data is still stored even if conversion fails
						if (!self.svgData || typeof self.svgData !== 'string') {
							self.svgData = svgString;
							console.log('✅ SVG data restored after conversion error');
						}
						// Fallback: try to create raster version
						self.createRasterFallback(p);
					});
				} else {
					console.warn('⚠️ SVG canvas not detected:', {
						isSVG: isSVG,
						hasCanvas: !!p.canvas,
						hasElt: !!(p.canvas && p.canvas.elt),
						tagName: p.canvas && p.canvas.elt ? p.canvas.elt.tagName : 'none',
						hasSVGGlobal: hasSVG,
						pSVGType: typeof p.SVG
					});
					console.log('Using raster canvas (not SVG)');
					
					// Even though we're using raster, we should still try to create SVG manually
					// by converting the canvas to SVG-like format, OR just accept that SVG won't work
					// For now, set svgData to null and continue with raster
					self.artworkData = p.canvas.toDataURL('image/png');
					self.svgData = null; // No SVG available when using raster fallback
					
					console.warn('⚠️ SVG generation failed - p5.SVG may not be loaded properly');
					console.warn('⚠️ Check browser console for p5.SVG loading errors');
					
					// Display the raster image
					self.displayRasterImage();
					
					// Remove the temporary p5 instance
					setTimeout(() => {
						p.remove();
					}, 100);
				}
			};
		});
		
		// Store reference to p5 instance
		this.currentP5Instance = tempP5;
	}
	
	createRasterFallback(p5Instance) {
		console.log('Creating raster fallback...');
		// Create a new raster canvas
		const fallbackP5 = new p5((p) => {
			p.setup = () => {
				p.createCanvas(this.fullWidth, this.fullHeight);
				p.canvas.elt.style.display = 'none';
				
				p.randomSeed(this.currentSeed);
				
				// Use stored color variations
				const bgR = Math.floor(240 * this.colorVariations.background);
				const bgG = Math.floor(245 * this.colorVariations.background);
				const bgB = Math.floor(250 * this.colorVariations.background);
				p.background(bgR, bgG, bgB);
				
				// Generate artwork
				const { ottawa, tokyo } = this.weatherData;
				this.drawWeatherPatterns(p, ottawa, tokyo);
				this.drawTemperatureCurves(p, ottawa, tokyo);
				this.drawHumidityEffects(p, ottawa, tokyo);
				this.drawWindPatterns(p, ottawa, tokyo);
				this.drawUniqueElements(p, ottawa, tokyo);
				
				// Save as PNG
				this.artworkData = p.canvas.toDataURL('image/png');
				this.displayRasterImage();
				
				setTimeout(() => {
					p.remove();
				}, 100);
			};
		});
	}
	
	displayRasterImage() {
		// Create a regular canvas for display
		const container = document.getElementById('artwork-sketch');
		if (!container) {
			console.error('artwork-sketch container not found');
			return;
		}
		
		if (!this.artworkData) {
			console.error('artworkData not available for display');
			// Show placeholder
			this.showPlaceholder(container);
			return;
		}
		
		console.log('Displaying raster image, data length:', this.artworkData.length);
		
		// Clear container
		container.innerHTML = '';
		
		// Create canvas element
		const canvas = document.createElement('canvas');
		canvas.width = this.displayWidth;
		canvas.height = this.displayHeight;
		canvas.style.display = 'block';
		canvas.style.margin = '0';
		canvas.style.padding = '0';
		canvas.style.border = 'none';
		canvas.style.outline = 'none';
		canvas.style.boxSizing = 'border-box';
		canvas.style.verticalAlign = 'top';
		
		const ctx = canvas.getContext('2d');
		
		// Load the PNG data and draw it scaled to display size
		const img = new Image();
		img.onload = () => {
			console.log('Image loaded, drawing to canvas...');
			ctx.drawImage(img, 0, 0, this.displayWidth, this.displayHeight);
			this.canvas = canvas; // Store reference
			console.log('Raster image displayed successfully');
		};
		img.onerror = (error) => {
			console.error('Failed to load raster image for display:', error);
			// Show error placeholder
			this.showErrorPlaceholder(ctx);
		};
		
		img.src = this.artworkData;
		container.appendChild(canvas);
	}
	
	showPlaceholder(container) {
		container.innerHTML = '';
		const canvas = document.createElement('canvas');
		canvas.width = this.displayWidth;
		canvas.height = this.displayHeight;
		canvas.style.display = 'block';
		const ctx = canvas.getContext('2d');
		this.showErrorPlaceholder(ctx);
		container.appendChild(canvas);
	}
	
	showErrorPlaceholder(ctx) {
		ctx.fillStyle = '#f0f5fa';
		ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
		ctx.fillStyle = '#666';
		ctx.font = '16px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('Generating artwork...', this.displayWidth / 2, this.displayHeight / 2);
	}
	
	async createHighResArtworkAsync(ottawa, tokyo, seed) {
		return new Promise((resolve) => {
			this.createHighResArtwork(ottawa, tokyo, seed);
			// Wait a bit for SVG conversion if needed
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}
	
	// High-res artwork is now the same as display (both use SVG)
	// This method is kept for compatibility but is no longer needed
	createHighResArtwork(ottawa, tokyo, seed) {
		// High-res artwork is already generated in generateArtworkSVG()
		// This method is kept for compatibility but does nothing
		console.log('High-res artwork already generated from SVG');
	}
	
	convertSVGtoPNG(svgElement) {
		// Create a temporary canvas to render SVG to PNG
		return new Promise((resolve, reject) => {
			console.log('Starting SVG to PNG conversion...');
			const img = new Image();
			const svgString = svgElement.outerHTML;
			
			// IMPORTANT: Store SVG data BEFORE conversion (in case it gets lost)
			if (!this.svgData || this.svgData !== svgString) {
				this.svgData = svgString;
				console.log('✅ SVG data stored in convertSVGtoPNG, length:', this.svgData.length);
			}
			
			const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);
			
			img.onload = () => {
				console.log('SVG image loaded, converting to PNG...');
				try {
					const canvas = document.createElement('canvas');
					canvas.width = this.fullWidth;
					canvas.height = this.fullHeight;
					const ctx = canvas.getContext('2d');
					ctx.drawImage(img, 0, 0, this.fullWidth, this.fullHeight);
					this.artworkData = canvas.toDataURL('image/png');
					console.log('PNG conversion successful, data length:', this.artworkData.length);
					
					// Ensure SVG data is still stored after conversion
					if (!this.svgData) {
						this.svgData = svgString;
						console.log('✅ SVG data re-stored after PNG conversion');
					}
					
					URL.revokeObjectURL(url);
					resolve();
				} catch (error) {
					console.error('Error during PNG conversion:', error);
					URL.revokeObjectURL(url);
					reject(error);
				}
			};
			
			img.onerror = (error) => {
				console.error('Failed to load SVG image:', error);
				URL.revokeObjectURL(url);
				reject(new Error('Failed to load SVG image'));
			};
			
			img.src = url;
			console.log('Set image src to blob URL');
		});
	}

    createSeed(ottawa, tokyo) {
        const tempDiff = Math.abs(ottawa.temperature - tokyo.temperature);
        const humidityAvg = (ottawa.humidity + tokyo.humidity) / 2;
        const pressureDiff = Math.abs(ottawa.pressure - tokyo.pressure);
        
        // Add timestamp and random component to ensure uniqueness
        const timestamp = Date.now();
        const randomComponent = Math.random() * 1000;
        
        return Math.floor(tempDiff * 100 + humidityAvg * 10 + pressureDiff + timestamp + randomComponent);
    }

    drawWeatherPatterns(p, ottawa, tokyo) {
        // Draw patterns based on weather descriptions
        const ottawaColor = this.getWeatherColor(ottawa.description);
        const tokyoColor = this.getWeatherColor(tokyo.description);
        
        // Ottawa side (left half) - use full resolution coordinates
        p.push();
        p.translate(0, 0);
        this.drawCityPattern(p, ottawa, ottawaColor, 0, 0, this.fullWidth/2, this.fullHeight);
        p.pop();
        
        // Tokyo side (right half) - use full resolution coordinates
        p.push();
        p.translate(this.fullWidth/2, 0);
        this.drawCityPattern(p, tokyo, tokyoColor, 0, 0, this.fullWidth/2, this.fullHeight);
        p.pop();
    }

    drawCityPattern(p, weather, color, x, y, w, h) {
        p.fill(color);
        p.noStroke();
        
        // Create organic shapes based on weather
        const numShapes = Math.floor(weather.humidity / 10) + 5;
        
        for (let i = 0; i < numShapes; i++) {
            const shapeX = p.random(x, x + w);
            const shapeY = p.random(y, y + h);
            const size = p.random(20, 80) * (weather.pressure / 1000);
            
            if (weather.description.includes('cloud')) {
                this.drawCloudShape(p, shapeX, shapeY, size);
            } else if (weather.description.includes('rain')) {
                this.drawRainShape(p, shapeX, shapeY, size);
            } else if (weather.description.includes('sun')) {
                this.drawSunShape(p, shapeX, shapeY, size);
            } else {
                this.drawAbstractShape(p, shapeX, shapeY, size);
            }
        }
    }

    drawCloudShape(p, x, y, size) {
        const variation = p.random(0.8, 1.2);
        const heightVariation = p.random(0.4, 0.8);
        p.ellipse(x, y, size * variation, size * heightVariation);
        p.ellipse(x + size/3 * p.random(0.8, 1.2), y, size * 0.8 * variation, size * 0.5 * heightVariation);
        p.ellipse(x - size/3 * p.random(0.8, 1.2), y, size * 0.7 * variation, size * 0.4 * heightVariation);
    }

    drawRainShape(p, x, y, size) {
        const rainCount = p.random(3, 8);
        for (let i = 0; i < rainCount; i++) {
            const offsetX = p.random(-2, 2);
            const offsetY = p.random(-2, 2);
            p.line(x + i * 2 + offsetX, y + offsetY, x + i * 2 + offsetX, y + size + offsetY);
        }
    }

    drawSunShape(p, x, y, size) {
        const sizeVariation = p.random(0.8, 1.2);
        p.ellipse(x, y, size * sizeVariation, size * sizeVariation);
        const rayCount = p.random(6, 12);
        for (let i = 0; i < rayCount; i++) {
            const angle = (p.TWO_PI / rayCount) * i + p.random(-0.2, 0.2);
            const rayLength = p.random(0.8, 1.2);
            const x1 = x + p.cos(angle) * size/2;
            const y1 = y + p.sin(angle) * size/2;
            const x2 = x + p.cos(angle) * size * rayLength;
            const y2 = y + p.sin(angle) * size * rayLength;
            p.line(x1, y1, x2, y2);
        }
    }

    drawAbstractShape(p, x, y, size) {
        p.beginShape();
        for (let i = 0; i < 6; i++) {
            const angle = (p.TWO_PI / 6) * i;
            const radius = p.random(size/3, size/2);
            const vertexX = x + p.cos(angle) * radius;
            const vertexY = y + p.sin(angle) * radius;
            p.vertex(vertexX, vertexY);
        }
        p.endShape(p.CLOSE);
    }

    drawTemperatureCurves(p, ottawa, tokyo) {
        p.stroke(255, 100, 100, 150);
        p.strokeWeight(3);
        p.noFill();
        
        // Ottawa temperature curve - use full resolution coordinates
        p.beginShape();
        for (let x = 0; x < this.fullWidth/2; x += 10) {
            const temp = ottawa.temperature;
            const y = this.fullHeight/2 + p.sin(x * 0.02) * temp * 2;
            p.vertex(x, y);
        }
        p.endShape();
        
        // Tokyo temperature curve - use full resolution coordinates
        p.beginShape();
        for (let x = this.fullWidth/2; x < this.fullWidth; x += 10) {
            const temp = tokyo.temperature;
            const y = this.fullHeight/2 + p.sin(x * 0.02) * temp * 2;
            p.vertex(x, y);
        }
        p.endShape();
    }

    drawHumidityEffects(p, ottawa, tokyo) {
        // Humidity affects opacity and density
        const ottawaOpacity = p.map(ottawa.humidity, 0, 100, 50, 200);
        const tokyoOpacity = p.map(tokyo.humidity, 0, 100, 50, 200);
        
        // Ottawa humidity particles - use full resolution coordinates
        p.fill(100, 150, 255, ottawaOpacity);
        for (let i = 0; i < ottawa.humidity; i++) {
            const x = p.random(0, this.fullWidth/2);
            const y = p.random(0, this.fullHeight);
            p.ellipse(x, y, 3, 3);
        }
        
        // Tokyo humidity particles - use full resolution coordinates
        p.fill(255, 150, 100, tokyoOpacity);
        for (let i = 0; i < tokyo.humidity; i++) {
            const x = p.random(this.fullWidth/2, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            p.ellipse(x, y, 3, 3);
        }
    }

    drawWindPatterns(p, ottawa, tokyo) {
        p.stroke(200, 200, 200, 100);
        p.strokeWeight(1);
        
        // Ottawa wind - use full resolution coordinates
        for (let i = 0; i < ottawa.windSpeed * 5; i++) {
            const x = p.random(0, this.fullWidth/2);
            const y = p.random(0, this.fullHeight);
            const length = ottawa.windSpeed * 10;
            p.line(x, y, x + length, y);
        }
        
        // Tokyo wind - use full resolution coordinates
        for (let i = 0; i < tokyo.windSpeed * 5; i++) {
            const x = p.random(this.fullWidth/2, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            const length = tokyo.windSpeed * 10;
            p.line(x, y, x + length, y);
        }
    }

    drawUniqueElements(p, ottawa, tokyo) {
        // Add unique signature elements that make each piece one-of-a-kind
        p.push();
        
        // Unique geometric patterns
        const patternCount = p.random(3, 8);
        for (let i = 0; i < patternCount; i++) {
            const x = p.random(0, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            const size = p.random(20, 80);
            const alpha = p.random(30, 80);
            
            p.fill(p.random(100, 255), p.random(100, 255), p.random(100, 255), alpha);
            p.noStroke();
            
            if (p.random() > 0.5) {
                p.ellipse(x, y, size, size * p.random(0.5, 1.5));
            } else {
                p.rect(x - size/2, y - size/2, size, size * p.random(0.5, 1.5));
            }
        }
        
        // Unique connecting lines
        const lineCount = p.random(5, 15);
        p.stroke(p.random(150, 255), p.random(150, 255), p.random(150, 255), p.random(40, 100));
        p.strokeWeight(p.random(1, 3));
        
        for (let i = 0; i < lineCount; i++) {
            const x1 = p.random(0, this.fullWidth);
            const y1 = p.random(0, this.fullHeight);
            const x2 = p.random(0, this.fullWidth);
            const y2 = p.random(0, this.fullHeight);
            p.line(x1, y1, x2, y2);
        }
        
        // Unique textural elements
        const textureCount = p.random(10, 25);
        p.fill(p.random(200, 255), p.random(200, 255), p.random(200, 255), p.random(20, 60));
        p.noStroke();
        
        for (let i = 0; i < textureCount; i++) {
            const x = p.random(0, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            const size = p.random(2, 8);
            p.ellipse(x, y, size, size);
        }
        
        p.pop();
    }

    getWeatherColor(description) {
        const colors = {
            'clear': [255, 215, 0],      // Gold
            'sun': [255, 165, 0],        // Orange
            'cloud': [169, 169, 169],    // Gray
            'rain': [70, 130, 180],      // Steel blue
            'snow': [255, 250, 250],     // Snow white
            'storm': [105, 105, 105],    // Dim gray
            'mist': [192, 192, 192],     // Silver
            'fog': [211, 211, 211]       // Light gray
        };
        
        for (const [key, color] of Object.entries(colors)) {
            if (description.toLowerCase().includes(key)) {
                return color;
            }
        }
        
        return [100, 150, 200]; // Default blue
    }

    getArtworkData() {
        return this.artworkData;
    }

    getSVGData() {
        const data = this.svgData;
        console.log('getSVGData() called:', {
            hasData: !!data,
            dataType: typeof data,
            dataLength: data ? (typeof data === 'string' ? data.length : 'not a string') : 0
        });
        return data;
    }

    getSeed() {
        return this.currentSeed;
    }

    getColorVariations() {
        return this.colorVariations;
    }

    // High-resolution versions of drawing methods for email attachment
    drawWeatherPatternsHighRes(p, ottawa, tokyo) {
        const ottawaColor = this.getWeatherColor(ottawa.description);
        const tokyoColor = this.getWeatherColor(tokyo.description);
        
        // Ottawa side (left half)
        p.push();
        p.translate(0, 0);
        this.drawCityPatternHighRes(p, ottawa, ottawaColor, 0, 0, this.fullWidth/2, this.fullHeight);
        p.pop();
        
        // Tokyo side (right half)
        p.push();
        p.translate(this.fullWidth/2, 0);
        this.drawCityPatternHighRes(p, tokyo, tokyoColor, 0, 0, this.fullWidth/2, this.fullHeight);
        p.pop();
    }

    drawCityPatternHighRes(p, cityData, color, x, y, w, h) {
        p.fill(color);
        p.noStroke();
        
        // Draw weather-specific patterns
        if (cityData.description.includes('cloud')) {
            this.drawCloudsHighRes(p, x, y, w, h);
        } else if (cityData.description.includes('rain')) {
            this.drawRainHighRes(p, x, y, w, h);
        } else if (cityData.description.includes('sun')) {
            this.drawSunHighRes(p, x, y, w, h);
        }
    }

    drawCloudsHighRes(p, x, y, w, h) {
        for (let i = 0; i < 8; i++) {
            const cloudX = p.random(x, x + w);
            const cloudY = p.random(y, y + h);
            const cloudSize = p.random(30, 80);
            p.ellipse(cloudX, cloudY, cloudSize, cloudSize * 0.6);
        }
    }

    drawRainHighRes(p, x, y, w, h) {
        p.stroke(100, 150, 255, 150);
        p.strokeWeight(2);
        for (let i = 0; i < 50; i++) {
            const rainX = p.random(x, x + w);
            const rainY = p.random(y, y + h);
            p.line(rainX, rainY, rainX, rainY + 20);
        }
    }

    drawSunHighRes(p, x, y, w, h) {
        const sunX = x + w/2;
        const sunY = y + h/3;
        const sunSize = 60;
        
        p.fill(255, 255, 100, 200);
        p.ellipse(sunX, sunY, sunSize, sunSize);
        
        // Sun rays
        p.stroke(255, 255, 100, 150);
        p.strokeWeight(3);
        for (let i = 0; i < 12; i++) {
            const angle = (p.TWO_PI / 12) * i;
            const rayX = sunX + p.cos(angle) * (sunSize/2 + 20);
            const rayY = sunY + p.sin(angle) * (sunSize/2 + 20);
            p.line(sunX, sunY, rayX, rayY);
        }
    }

    drawTemperatureCurvesHighRes(p, ottawa, tokyo) {
        p.stroke(255, 100, 100, 150);
        p.strokeWeight(4);
        p.noFill();
        
        // Ottawa temperature curve
        p.beginShape();
        for (let x = 0; x < this.fullWidth/2; x += 15) {
            const temp = ottawa.temperature;
            const y = this.fullHeight/2 + p.sin(x * 0.01) * temp * 3;
            p.vertex(x, y);
        }
        p.endShape();
        
        // Tokyo temperature curve
        p.beginShape();
        for (let x = this.fullWidth/2; x < this.fullWidth; x += 15) {
            const temp = tokyo.temperature;
            const y = this.fullHeight/2 + p.sin(x * 0.01) * temp * 3;
            p.vertex(x, y);
        }
        p.endShape();
    }

    drawHumidityEffectsHighRes(p, ottawa, tokyo) {
        const ottawaOpacity = p.map(ottawa.humidity, 0, 100, 50, 200);
        const tokyoOpacity = p.map(tokyo.humidity, 0, 100, 50, 200);
        
        // Ottawa humidity particles
        p.fill(100, 150, 255, ottawaOpacity);
        for (let i = 0; i < ottawa.humidity * 2; i++) {
            const x = p.random(0, this.fullWidth/2);
            const y = p.random(0, this.fullHeight);
            p.ellipse(x, y, 4, 4);
        }
        
        // Tokyo humidity particles
        p.fill(255, 150, 100, tokyoOpacity);
        for (let i = 0; i < tokyo.humidity * 2; i++) {
            const x = p.random(this.fullWidth/2, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            p.ellipse(x, y, 4, 4);
        }
    }

    drawWindPatternsHighRes(p, ottawa, tokyo) {
        p.stroke(200, 200, 200, 100);
        p.strokeWeight(2);
        
        // Ottawa wind lines
        for (let i = 0; i < ottawa.windSpeed * 2; i++) {
            const x1 = p.random(0, this.fullWidth/2);
            const y1 = p.random(0, this.fullHeight);
            const x2 = x1 + p.random(-80, 80);
            const y2 = y1 + p.random(-30, 30);
            p.line(x1, y1, x2, y2);
        }
        
        // Tokyo wind lines
        for (let i = 0; i < tokyo.windSpeed * 2; i++) {
            const x1 = p.random(this.fullWidth/2, this.fullWidth);
            const y1 = p.random(0, this.fullHeight);
            const x2 = x1 + p.random(-80, 80);
            const y2 = y1 + p.random(-30, 30);
            p.line(x1, y1, x2, y2);
        }
    }

    drawUniqueElementsHighRes(p, ottawa, tokyo) {
        // Add unique signature elements that make each piece one-of-a-kind (high-res version)
        p.push();
        
        // Unique geometric patterns
        const patternCount = p.random(5, 12);
        for (let i = 0; i < patternCount; i++) {
            const x = p.random(0, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            const size = p.random(30, 120);
            const alpha = p.random(40, 100);
            
            p.fill(p.random(100, 255), p.random(100, 255), p.random(100, 255), alpha);
            p.noStroke();
            
            if (p.random() > 0.5) {
                p.ellipse(x, y, size, size * p.random(0.5, 1.5));
            } else {
                p.rect(x - size/2, y - size/2, size, size * p.random(0.5, 1.5));
            }
        }
        
        // Unique connecting lines
        const lineCount = p.random(8, 20);
        p.stroke(p.random(150, 255), p.random(150, 255), p.random(150, 255), p.random(50, 120));
        p.strokeWeight(p.random(2, 5));
        
        for (let i = 0; i < lineCount; i++) {
            const x1 = p.random(0, this.fullWidth);
            const y1 = p.random(0, this.fullHeight);
            const x2 = p.random(0, this.fullWidth);
            const y2 = p.random(0, this.fullHeight);
            p.line(x1, y1, x2, y2);
        }
        
        // Unique textural elements
        const textureCount = p.random(15, 35);
        p.fill(p.random(200, 255), p.random(200, 255), p.random(200, 255), p.random(30, 80));
        p.noStroke();
        
        for (let i = 0; i < textureCount; i++) {
            const x = p.random(0, this.fullWidth);
            const y = p.random(0, this.fullHeight);
            const size = p.random(3, 12);
            p.ellipse(x, y, size, size);
        }
        
        p.pop();
    }
}

// Export for use in main app
window.WeatherArtGenerator = WeatherArtGenerator;
