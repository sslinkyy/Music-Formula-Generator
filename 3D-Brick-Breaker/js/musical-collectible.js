// Musical Collectible: drops from bricks and can be collected to build songs
class MusicalCollectible {
    constructor(scene, x, y, z, type) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = { x: 0, y: -2, z: 0 };  // Falls down slowly (was -5)
        this.type = type;  // genre, beat, melody, sfx, tempo, style
        this.collected = false;
        this.lifetime = 20;  // Seconds before disappearing (increased from 8)
        this.age = 0;

        // Define collectible types and their properties
        this.collectibleTypes = {
            // Genre pieces
            genre: {
                values: ['Street Rap', 'Drill', 'Boom Bap', 'Trap', 'Lo-Fi', 'Jazz Rap', 'Cloud Rap', 'Emo Rap'],
                color: 0xff6b9d,
                icon: '🎵',
                label: 'Genre'
            },
            // Beat patterns
            beat: {
                values: ['808 Hit', 'Snare Roll', 'Hi-Hat', 'Kick', 'Clap', 'Rim Shot', 'Tom', 'Cowbell'],
                color: 0x4ecdc4,
                icon: '🥁',
                label: 'Beat'
            },
            // Melody elements
            melody: {
                values: ['Piano Riff', 'Synth Lead', 'Bass Line', 'Guitar Loop', 'Vocal Chop', 'String Section', 'Pad', 'Arp'],
                color: 0xffe66d,
                icon: '🎹',
                label: 'Melody'
            },
            // Sound effects
            sfx: {
                values: ['Vinyl Crackle', 'Tape Stop', 'Crowd Stomp', 'Ad-Lib Yeah', 'Gun Click', 'Siren', 'Air Horn', 'DJ Scratch'],
                color: 0x95e1d3,
                icon: '🔊',
                label: 'SFX'
            },
            // Tempo modifiers
            tempo: {
                values: ['86-94 BPM', '92-104 BPM', '104-116 BPM', '116-128 BPM', '128-140 BPM', '138-146 BPM', '140-150 BPM'],
                color: 0xf38181,
                icon: '⏱️',
                label: 'Tempo'
            },
            // Style tags
            style: {
                values: ['Anthemic', 'Dark Minor', 'Swing', 'Bounce', 'Chill Vibes', 'Aggressive', 'Melodic', 'Experimental'],
                color: 0xaa96da,
                icon: '✨',
                label: 'Style'
            }
        };

        // Get specific collectible data
        this.data = this.collectibleTypes[type];
        this.value = this.data.values[Math.floor(Math.random() * this.data.values.length)];

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // Create rotating cube with glow
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({
            color: this.data.color,
            metalness: 0.6,
            roughness: 0.2,
            emissive: this.data.color,
            emissiveIntensity: 0.5
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        this.mesh.add(cube);

        // Add glowing edges
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        cube.add(edges);

        // Add outer glow sphere
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);

        // Add point light for visibility
        const light = new THREE.PointLight(this.data.color, 1.5, 10);
        light.position.set(0, 0, 0);
        this.mesh.add(light);

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);

        // Store references
        this.cubeMesh = cube;
        this.glowMesh = glow;
        this.lightMesh = light;
    }

    update(deltaTime) {
        if (this.collected) return;

        this.age += deltaTime;

        // Apply gravity/velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Gentle drift toward paddle for easier collection
        const game = window.game;
        if (game && game.paddle) {
            const paddleX = game.paddle.position.x;
            const dx = paddleX - this.position.x;
            const driftSpeed = 3;  // Units per second toward paddle
            if (Math.abs(dx) > 0.5) {
                this.position.x += Math.sign(dx) * driftSpeed * deltaTime;
            }
        }

        // Rotate cube continuously
        this.cubeMesh.rotation.x += deltaTime * 2;
        this.cubeMesh.rotation.y += deltaTime * 3;

        // Bobbing animation
        const bobOffset = Math.sin(Date.now() * 0.005) * 0.2;
        this.mesh.position.set(
            this.position.x,
            this.position.y + bobOffset,
            this.position.z
        );

        // Pulse glow
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        this.glowMesh.material.opacity = pulse * 0.3;
        this.lightMesh.intensity = pulse * 1.5;

        // Fade out near end of lifetime
        if (this.age > this.lifetime - 3) {
            const fadeProgress = (this.age - (this.lifetime - 3)) / 3;
            this.mesh.scale.setScalar(1 - fadeProgress * 0.5);
            this.cubeMesh.material.opacity = 1 - fadeProgress;
            this.glowMesh.material.opacity *= (1 - fadeProgress);
        }

        // Check if expired
        if (this.age >= this.lifetime) {
            this.destroy();
            return false;
        }

        return true;
    }

    checkPaddleCollision(paddle) {
        if (this.collected) return false;

        const paddleBox = paddle.getBox();
        const collectibleBox = new THREE.Box3().setFromObject(this.mesh);

        if (paddleBox.intersectsBox(collectibleBox)) {
            this.collect();
            return true;
        }

        return false;
    }

    collect() {
        if (this.collected) return;
        this.collected = true;

        // Create collection effect
        this.createCollectionEffect();

        // Notify game of collection
        const game = window.game;
        if (game) {
            game.collectMusicalElement(this.type, this.value, this.data);
        }

        // Destroy after brief animation
        setTimeout(() => this.destroy(), 300);
    }

    createCollectionEffect() {
        // Burst of particles
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const particle = new Particle(
                this.scene,
                this.position.x,
                this.position.y,
                this.position.z,
                this.data.color
            );
            particle.velocity.x = (Math.random() - 0.5) * 8;
            particle.velocity.y = Math.random() * 8 + 4;
            particle.velocity.z = (Math.random() - 0.5) * 8;
            particle.lifetime = 0.5;

            if (window.game) {
                window.game.particles.push(particle);
            }
        }

        // Flash effect
        if (this.mesh) {
            this.mesh.scale.setScalar(2);
        }
    }

    destroy() {
        if (this.mesh) {
            this.cubeMesh.geometry.dispose();
            this.cubeMesh.material.dispose();
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}
