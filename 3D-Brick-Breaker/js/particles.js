class Particle {
    constructor(scene, x, y, z, color = 0xffffff) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 0.2 + Math.random() * 0.3;
        this.color = color;

        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;

        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Decrease life
        this.life -= this.decay;
        this.mesh.material.opacity = Math.max(0, this.life);

        // Shrink particle
        const scale = this.life;
        this.mesh.scale.setScalar(scale);
    }

    isDead() {
        return this.life <= 0;
    }

    destroy() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}

class TrailParticle extends Particle {
    constructor(scene, x, y, z, color = 0xffffff) {
        super(scene, x, y, z, color);
        this.decay = 0.05;
        this.velocity = { x: 0, y: 0, z: 0 };
    }

    update(deltaTime) {
        // Don't apply gravity to trail particles
        this.life -= this.decay;
        this.mesh.material.opacity = Math.max(0, this.life);

        const scale = this.life;
        this.mesh.scale.setScalar(scale);
    }
}

class SparkParticle {
    constructor(scene, x, y, z, color = 0xffff00) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: Math.random() * 8,
            z: (Math.random() - 0.5) * 8
        };
        this.life = 1.0;
        this.decay = 0.03;
        this.color = color;

        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Orient towards velocity
        const direction = new THREE.Vector3(
            this.velocity.x,
            this.velocity.y,
            this.velocity.z
        ).normalize();
        this.mesh.lookAt(direction);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Apply gravity
        this.velocity.y -= 15 * deltaTime;

        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Orient towards velocity
        const direction = new THREE.Vector3(
            this.velocity.x,
            this.velocity.y,
            this.velocity.z
        ).normalize();
        this.mesh.lookAt(direction);

        // Decrease life
        this.life -= this.decay;
        this.mesh.material.opacity = Math.max(0, this.life);
    }

    isDead() {
        return this.life <= 0 || this.position.y < -15;
    }

    destroy() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}
