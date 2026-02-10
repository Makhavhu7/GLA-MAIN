#!/usr/bin/env node
/**
 * Build script for Vercel deployment
 * Copies static assets to public directory
 */

const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Copy HTML files
const htmlFiles = [
  'index.html', 'about.html', 'Apply.html', 'Awards&Testimonials.html',
  'History.html', 'Media.html', 'OurTeam.html', 'Publications.html', 'Supporters.html'
];

htmlFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// Copy CSS files
const cssFiles = ['masterpage.css', 'chatbot.css'];
cssFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// Copy JS files
const jsFiles = ['masterpage.js', 'chatbot.js'];
jsFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// Copy Assets folder
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

const assetsDir = path.join(__dirname, 'Assets');
const publicAssetsDir = path.join(publicDir, 'Assets');

if (fs.existsSync(assetsDir)) {
  copyDir(assetsDir, publicAssetsDir);
  console.log('Copied Assets directory');
}

console.log('Build complete - static files ready for deployment');
