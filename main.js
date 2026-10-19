(() => {
  const W = 960, H = 540;
  const held = { left: false, right: false };
  let player, cursors, keys, platforms, dashReady = true, dashUntil = 0, dashCooldownUntil = 0;
  let statusText, sceneRef;

  class CyberfantasiaScene extends Phaser.Scene {
    constructor() { super("CyberfantasiaScene"); }

    create() {
      sceneRef = this;
      this.physics.world.setBounds(0, 0, W, H);
      this.cameras.main.setBackgroundColor("#101729");

      // Distant pixel-style skyline
      const bg = this.add.graphics();
      bg.fillStyle(0x17213a, 1);
      for (let i = 0; i < 20; i++) {
        const x = i * 52 - 4, h = 65 + ((i * 37) % 125);
        bg.fillRect(x, H - h - 44, 39, h);
        bg.fillStyle(0x3c6d91, 0.65);
        for (let wy = H - h - 30; wy < H - 55; wy += 18) {
          if ((i + Math.floor(wy / 18)) % 3 !== 0) bg.fillRect(x + 8, wy, 4, 6);
        }
        bg.fillStyle(0x17213a, 1);
      }

      platforms = this.physics.add.staticGroup();
      this.makePlatform(480, 520, 960, 40);
      this.makePlatform(230, 415, 180, 18);
      this.makePlatform(490, 335, 160, 18);
      this.makePlatform(735, 250, 170, 18);
      this.makePlatform(850, 430, 110, 18);

      // Placeholder character: replace with custom pixel-art sprites later.
      const graphics = this.add.graphics();
      graphics.fillStyle(0x63e8ff, 1);
      graphics.fillRect(2, 2, 24, 34);
      graphics.fillStyle(0xeafcff, 1);
      graphics.fillRect(8, 7, 12, 6);
      graphics.fillStyle(0x9b63ff, 1);
      graphics.fillRect(4, 28, 8, 6);
      graphics.fillRect(16, 28, 8, 6);
      graphics.generateTexture("nexuscore-placeholder", 28, 38);
      graphics.destroy();

      player = this.physics.add.sprite(90, 440, "nexuscore-placeholder");
      player.setCollideWorldBounds(true);
      player.setBounce(0);
      player.setMaxVelocity(330, 760);
      player.body.setSize(22, 34).setOffset(3, 3);
      this.physics.add.collider(player, platforms);

      cursors = this.input.keyboard.createCursorKeys();
      keys = this.input.keyboard.addKeys("A,D,W,SPACE,SHIFT,X,R");

      this.add.text(18, 16, "NEXUSCORE-12", {
        fontFamily: "monospace", fontSize: "18px", color: "#8cecff", fontStyle: "bold"
      }).setScrollFactor(0);
      statusText = this.add.text(18, 42, "SYSTEM: ONLINE", {
        fontFamily: "monospace", fontSize: "12px", color: "#c1cce8"
      }).setScrollFactor(0);
      this.add.text(18, 70, "Reach the upper platforms. Prototype v0.1", {
        fontFamily: "monospace", fontSize: "12px", color: "#8e9bb9"
      }).setScrollFactor(0);

      this.cameras.main.startFollow(player, true, 0.08, 0.08);
      this.cameras.main.setBounds(0, 0, W, H);
      this.physics.world.setBounds(0, 0, W, H);
      this.input.keyboard.on("keydown-R", () => this.scene.restart());

      this.add.text(W - 18, 18, "TEST ZONE 01", {
        fontFamily: "monospace", fontSize: "12px", color: "#d18bff"
      }).setOrigin(1, 0);
    }

    makePlatform(x, y, width, height) {
      const p = this.add.rectangle(x, y, width, height, 0x263653).setStrokeStyle(2, 0x58d9f3);
      this.physics.add.existing(p, true);
      platforms.add(p);
      const glow = this.add.rectangle(x, y - height / 2, width, 3, 0x8cecff, 0.8);
      glow.setDepth(1);
    }

    update(time) {
      const left = cursors.left.isDown || keys.A.isDown || held.left;
      const right = cursors.right.isDown || keys.D.isDown || held.right;
      const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) ||
        Phaser.Input.Keyboard.JustDown(cursors.space) ||
        Phaser.Input.Keyboard.JustDown(keys.W) ||
        Phaser.Input.Keyboard.JustDown(keys.SPACE);
      const dashPressed = Phaser.Input.Keyboard.JustDown(keys.SHIFT) ||
        Phaser.Input.Keyboard.JustDown(keys.X);

      if (time > dashUntil && player.body.allowGravity === false) {
        player.body.allowGravity = true;
        player.setTint(0xffffff);
      }

      if (dashPressed && time > dashCooldownUntil) {
        const dir = left && !right ? -1 : (right && !left ? 1 : (player.flipX ? -1 : 1));
        player.setVelocityX(dir * 620);
        player.setVelocityY(0);
        player.body.allowGravity = false;
        player.setTint(0xd18bff);
        dashUntil = time + 145;
        dashCooldownUntil = time + 720;
      } else if (time > dashUntil) {
        const speed = 245;
        if (left) { player.setVelocityX(-speed); player.setFlipX(true); }
        else if (right) { player.setVelocityX(speed); player.setFlipX(false); }
        else player.setVelocityX(Phaser.Math.Linear(player.body.velocity.x, 0, 0.22));
      }

      if (jumpPressed && player.body.blocked.down) {
        player.setVelocityY(-465);
      }

      statusText.setText(time < dashCooldownUntil
        ? "SYSTEM: ONLINE // DASH RECHARGING"
        : "SYSTEM: ONLINE // DASH READY");

      if (player.y > H + 80) {
        player.setPosition(90, 440);
        player.setVelocity(0, 0);
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    pixelArt: true,
    backgroundColor: "#101729",
    physics: { default: "arcade", arcade: { gravity: { y: 1050 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [CyberfantasiaScene]
  };

  new Phaser.Game(config);

  function bindHold(id, prop) {
    const el = document.getElementById(id);
    const down = (e) => { e.preventDefault(); held[prop] = true; };
    const up = (e) => { e.preventDefault(); held[prop] = false; };
    el.addEventListener("pointerdown", down);
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => el.addEventListener(ev, up));
  }
  bindHold("left", "left");
  bindHold("right", "right");
  document.getElementById("jump").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (sceneRef && player && player.body.blocked.down) player.setVelocityY(-465);
  });
  document.getElementById("dash").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!sceneRef || !player) return;
    const now = sceneRef.time.now;
    if (now <= dashCooldownUntil) return;
    const dir = held.left && !held.right ? -1 : (held.right && !held.left ? 1 : (player.flipX ? -1 : 1));
    player.setVelocityX(dir * 620);
    player.setVelocityY(0);
    player.body.allowGravity = false;
    player.setTint(0xd18bff);
    dashUntil = now + 145;
    dashCooldownUntil = now + 720;
  });
})();
