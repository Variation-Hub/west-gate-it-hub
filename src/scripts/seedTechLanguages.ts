import mongoose from "mongoose";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Technology from "../Models/technologyModel";
import Language from "../Models/languageModel";

dotenv.config();

// Function to seed technologies and languages from JSON files to database
async function seedTechLanguages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log('Connected to database');

    // Read technologies.json
    const technologiesPath = path.join(__dirname, '../Util/technologies.json');
    const technologies = JSON.parse(fs.readFileSync(technologiesPath, 'utf8'));

    // Read languages.json
    const languagesPath = path.join(__dirname, '../Util/languages.json');
    const languages = JSON.parse(fs.readFileSync(languagesPath, 'utf8'));

    // Check if technologies already exist in the database
    const existingTechnologies = await Technology.find({});
    
    // If no technologies exist, seed them
    if (existingTechnologies.length === 0) {
      console.log('Seeding technologies...');
      
      // Create technologies in batches to avoid overwhelming the database
      const techBatchSize = 100;
      for (let i = 0; i < technologies.length; i += techBatchSize) {
        const batch = technologies.slice(i, i + techBatchSize).map((tech: string) => ({
          name: tech,
          isSystem: true
        }));
        
        await Technology.insertMany(batch);
        console.log(`Inserted technologies batch ${i/techBatchSize + 1}`);
      }
      
      console.log(`${technologies.length} technologies seeded successfully`);
    } else {
      console.log('Technologies already exist in the database, skipping seed');
    }

    // Check if languages already exist in the database
    const existingLanguages = await Language.find({});
    
    // If no languages exist, seed them
    if (existingLanguages.length === 0) {
      console.log('Seeding languages...');
      
      // Create languages in batches
      const langBatchSize = 50;
      for (let i = 0; i < languages.length; i += langBatchSize) {
        const batch = languages.slice(i, i + langBatchSize).map((lang: string) => ({
          name: lang,
          isSystem: true
        }));
        
        await Language.insertMany(batch);
        console.log(`Inserted languages batch ${i/langBatchSize + 1}`);
      }
      
      console.log(`${languages.length} languages seeded successfully`);
    } else {
      console.log('Languages already exist in the database, skipping seed');
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTechLanguages();
