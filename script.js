class Tree {
    constructor(x, y, trunkLength) {
        let a = createVector(x, y);
        let b = createVector(x, y - trunkLength); // Ensures the trunk is straight up
        this.root = new Branch(a, b, null, 1);
        this.branches = [this.root];
        this.leaves = [];
        this.createInitialBranches();
        // Unique wind modifier for each tree
        this.windStrengthOffset = random(1000)*0;
        this.windAngleOffset = random(1000)*0;
        this.windModifier = random(0.5, 2); // Adjust the range as needed
    }

    createInitialBranches() {
        // Randomly decide the number of initial branching iterations
        let iterations = Math.floor(random(3, 6));
        for (let j = 0; j < iterations; j++) {
            for (let i = this.branches.length - 1; i >= 0; i--) {
                if (!this.branches[i].finished) {
                    let newBranches = this.branches[i].branchOut();
                    this.branches[i].finished = true;
                    this.branches.push(...newBranches);
                }
            }
        }
    }

    growAndShow(globalWind) {
         // Create a unique wind vector for this tree
         let windStrength = noise(frameCount * 0.01 + this.windStrengthOffset) * 0.001;
         let windAngle = noise(frameCount * 0.01 + this.windAngleOffset) * TWO_PI;
         let treeWind = p5.Vector.fromAngle(windAngle);
         treeWind.mult(windStrength * this.windModifier);
 
         // Combine global wind with tree-specific wind
         let combinedWind = p5.Vector.add(globalWind, treeWind);
        for (let branch of this.branches) {
            branch.grow();
            branch.physics(combinedWind);
         
            if (!branch.finished && !branch.leaf) {
                branch.leaf = true;
                let leaf = new Leaf(branch);
                this.leaves.push(leaf);
            }
        }

        for (let leaf of this.leaves) {
            leaf.show();
            leaf.physics(combinedWind);
        }
         // Remove old leaves
         this.leaves = this.leaves.filter(leaf => {
            if (!leaf.status && leaf.timeOnGround > leaf.decompositionTime) {
                return false; // Remove the leaf
            }
            return true;
        })
    }
}


class Branch {
    constructor(begin, end, parent, mass) {
      this.begin = begin;
      this.end = end;
      this.currentEnd = begin;
      this.parent = parent;
      this.finished = false;
      this.growth = 0;
      this.growing = true;
      this.leaf = false;
      this.mass = mass;
      this.displacement = createVector(0, 0);
      this.velocity = createVector(0, 0);
      this.acceleration = createVector(0, 0);
      this.branchRules = [
        [random(PI / 8, PI / 4), random(0.6, 0.8)], 
        [-random(PI / 8, PI / 4), random(0.6, 0.8)],
        [random(-PI / 6, PI / 6), random(0.4, 0.6)]
    ];
    this.growthRate = 100;
    this.limit = random(PI / 3, PI / 2);
    this.windStrengthOffset = random(1000);
    this.windAngleOffset = random(1000);
    this.maxDisplacement = 10; // Maximum displacement, adjust as needed

    }
  
    physics(globalWind) {
        // Calculate branch-specific wind using Perlin noise
        let windStrength = noise(frameCount * 0.01 + this.windStrengthOffset) * 0.001;
        let windAngle = noise(frameCount * 0.01 + this.windAngleOffset) * TWO_PI;
        let branchWind = p5.Vector.fromAngle(windAngle);
        branchWind.mult(windStrength);

        // Combine global wind with branch-specific wind
        let combinedWind = p5.Vector.add(globalWind, branchWind);

        // Apply the wind effect to the branch's physics
        // The constant 'k' represents a spring constant for the displacement effect
        const k = -0.001;
        this.acceleration = combinedWind.copy().div(this.mass);
        this.velocity.add(this.acceleration).add(this.displacement.copy().mult(k));
        this.displacement.add(this.velocity);

        // Ensuring that the branch length does not change
        if (this.displacement.mag() > this.maxDisplacement) {
            this.displacement.setMag(this.maxDisplacement);
        }
        this.currentEnd = p5.Vector.add(this.begin, p5.Vector.sub(this.end, this.begin));
        this.realEnd = p5.Vector.add(this.currentEnd, this.displacement);
        
    }
  
    grow() {
      stroke(255);
      strokeWeight(Math.pow(this.mass, 3) * 15);
  
      const updateEnd = () => {
        let realGrowth = this.growing ? 1 + Math.sin(this.growth - PI / 2) : Math.sin(this.growth);
        let direction = p5.Vector.sub(this.end, this.begin).mult(Math.sin(realGrowth));
        this.currentEnd = p5.Vector.add(this.begin, direction);
      };
  
      if (this.growth <= this.limit) {
        this.growth += this.growthRate;
        if (this.parent) {
          updateEnd();
          this.currentEnd = p5.Vector.add(this.parent.realEnd, p5.Vector.sub(this.currentEnd, this.parent.realEnd));
        } else {
          updateEnd();
        }
      } else {
        this.growing = false;
      }
  
      this.realEnd = p5.Vector.add(this.currentEnd, this.displacement);
      line(this.parent ? this.parent.realEnd.x : this.begin.x, this.parent ? this.parent.realEnd.y : this.begin.y, this.realEnd.x, this.realEnd.y);
    }
  
    branchOut() {
      return this.branchRules.map(rule => {
        let dir = p5.Vector.sub(this.end, this.begin).rotate(rule[0]).mult(rule[1]);
        return new Branch(this.end, p5.Vector.add(this.end, dir), this, this.mass * 0.80);
      });
    }
  }
  
  class Leaf {
    constructor(branch) {
      this.branch = branch;
      this.position = branch.end.copy();
      this.currentSize = 1;
      this.maxSize = 50;
      this.growthRate = 0.2 * Math.random();
      this.status = true;
      this.compost = 0;
      this.mass = 0.5;
      this.velocity = createVector(0, 0);
      this.acceleration = createVector(0, 0);
      // Color properties
      this.initialColor = color(27,141,87); // Green
      this.finalColor = color(174,48,86); // Red
      this.colorTransitionSpeed = 0.001;
      this.currentColor = this.initialColor;
      this.timeOnGround = 0; // Time spent on the ground
      this.decompositionTime = 1000; // Time after which the leaf gets deleted
    }
  
    // Update leaf color based on age
    updateColor() {
      if (this.compost < 1000) { // Change 100 to control how fast color changes
        this.currentColor = lerpColor(this.initialColor, this.finalColor, this.compost * this.colorTransitionSpeed);
      } else {
        this.currentColor = this.finalColor;
      }
    }
  
    physics(force) {
      if (!this.status && this.position.y < height) {
        let g = createVector(0, Math.random() * 0.05);
        this.acceleration = force.copy().div(this.mass).add(g);
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
      }
    }
  
    show() {
      if (Math.random() < 0.00005) {
        this.status = false;
        this.branch.leaf = false;
      }
      if (Math.random() < 0.05) {
        this.compost++;
      }

  
      // Update color based on age
      this.updateColor();
  
      fill(this.currentColor);
      noStroke();
      let size = this.currentSize <= this.maxSize ? (this.currentSize += this.growthRate) : this.maxSize;
      ellipse(this.status ? this.branch.realEnd.x : this.position.x, this.status ? this.branch.realEnd.y : this.position.y, size, size);
    
      if (!this.status) {
        this.compost++;
        this.timeOnGround++;
      }
      // Increment time on ground if the leaf has fallen

    }
  }
  
  
  // ... Rest of your p5.js setup and draw functions ...
  // Global variables for tree and leaves

let trees = [];

function setup() {
    createCanvas(windowWidth, windowHeight);

    let n_trees = 2;
    let segmentWidth = width / n_trees; // Width of each segment

    for (let i = 0; i < n_trees; i++) {
        let x = random(i * segmentWidth, (i + 1) * segmentWidth); // Random x position within the segment
        let y = height; // Base of the tree at the bottom of the canvas
        let trunkLength = random(100, 200); // Random trunk length

        trees.push(new Tree(x, y, trunkLength));
    }
}

function draw() {
    background(51);
 // Adjust these values to change the range of wind angles
 let minWindAngle = PI / 4; // 45 degrees
 let maxWindAngle = 3 * PI / 4; // 135 degrees

 // Global wind calculation
 let windStrength = noise(frameCount * 0.01) * 0.005;
 
 // Calculate a wind angle within a horizontal range using noise
 let windAngle = map(noise(frameCount * 0.01 + 1000), 0, 1, minWindAngle, maxWindAngle);

 let globalWind = p5.Vector.fromAngle(windAngle);
 globalWind.mult(windStrength);

for (let tree of trees) {
    tree.growAndShow(globalWind);
}
}
