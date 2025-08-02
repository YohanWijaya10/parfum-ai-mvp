#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import DeepSeekClient from './deepseek-client.js';
import DataManager from './data-manager.js';

class AIParfumConsultant {
  constructor() {
    this.deepseek = new DeepSeekClient();
    this.dataManager = new DataManager();
    this.parfumData = null;
  }

  async init() {
    try {
      console.log(chalk.cyan.bold('\n🌺 === AI PARFUM CONSULTANT === 🌺\n'));
      console.log(chalk.yellow('Memuat data parfum...'));
      
      this.parfumData = await this.dataManager.loadParfumData();
      
      console.log(chalk.green(`✅ Data berhasil dimuat: ${this.parfumData.parfums.length} parfum tersedia\n`));
      
      await this.showMainMenu();
    } catch (error) {
      console.error(chalk.red(`❌ Error saat inisialisasi: ${error.message}`));
      process.exit(1);
    }
  }

  async showMainMenu() {
    const choices = [
      { name: '🎯 Dapatkan Rekomendasi Parfum', value: 'recommend' },
      { name: '❓ Tanya Seputar Parfum', value: 'ask' },
      { name: '⚖️  Bandingkan Parfum', value: 'compare' },
      { name: '🔍 Cari Parfum', value: 'search' },
      { name: '📋 Lihat Semua Parfum', value: 'list' },
      { name: '📊 Statistik Database', value: 'stats' },
      { name: '🚪 Keluar', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Pilih layanan yang Anda inginkan:',
        choices
      }
    ]);

    await this.handleAction(action);
  }

  async handleAction(action) {
    switch (action) {
      case 'recommend':
        await this.getRecommendation();
        break;
      case 'ask':
        await this.askQuestion();
        break;
      case 'compare':
        await this.compareParfums();
        break;
      case 'search':
        await this.searchParfums();
        break;
      case 'list':
        await this.listAllParfums();
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'exit':
        console.log(chalk.cyan('Terima kasih telah menggunakan AI Parfum Consultant! 👋'));
        process.exit(0);
        break;
    }
    
    await this.continueOrExit();
  }

  async getRecommendation() {
    console.log(chalk.blue.bold('\n🎯 === REKOMENDASI PARFUM === 🎯\n'));
    
    const questions = [
      {
        type: 'list',
        name: 'gender',
        message: 'Jenis kelamin:',
        choices: ['Men', 'Women', 'Unisex']
      },
      {
        type: 'checkbox',
        name: 'occasions',
        message: 'Occasion penggunaan:',
        choices: ['Casual', 'Office', 'Formal', 'Night', 'Party', 'Romantic', 'Sport']
      },
      {
        type: 'checkbox',
        name: 'seasons',
        message: 'Musim/cuaca:',
        choices: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season']
      },
      {
        type: 'list',
        name: 'budget',
        message: 'Budget range:',
        choices: ['Low', 'Medium', 'Medium-High', 'High', 'Tidak masalah']
      },
      {
        type: 'input',
        name: 'preferences',
        message: 'Ceritakan preferensi Anda (note yang disukai, karakter parfum, dll):',
        validate: input => input.length > 5 || 'Mohon berikan deskripsi yang lebih detail'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    const preferences = `
    Jenis kelamin: ${answers.gender}
    Occasion: ${answers.occasions.join(', ')}
    Musim: ${answers.seasons.join(', ')}
    Budget: ${answers.budget}
    Preferensi tambahan: ${answers.preferences}
    `;

    const spinner = ora('Menganalisis preferensi dan mencari rekomendasi terbaik...').start();
    
    try {
      const recommendation = await this.deepseek.getParfumRecommendation(preferences, this.parfumData);
      spinner.succeed('Rekomendasi berhasil dibuat!');
      
      console.log(chalk.green.bold('\n📝 === REKOMENDASI UNTUK ANDA === 📝\n'));
      console.log(chalk.white(recommendation));
      
    } catch (error) {
      spinner.fail('Gagal mendapatkan rekomendasi');
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async askQuestion() {
    console.log(chalk.blue.bold('\n❓ === TANYA SEPUTAR PARFUM === ❓\n'));
    
    const { question } = await inquirer.prompt([
      {
        type: 'input',
        name: 'question',
        message: 'Tanyakan apapun seputar parfum:',
        validate: input => input.length > 3 || 'Pertanyaan terlalu pendek'
      }
    ]);

    const spinner = ora('Mencari jawaban...').start();
    
    try {
      const answer = await this.deepseek.answerParfumQuestion(question, this.parfumData);
      spinner.succeed('Jawaban siap!');
      
      console.log(chalk.green.bold('\n💡 === JAWABAN === 💡\n'));
      console.log(chalk.white(answer));
      
    } catch (error) {
      spinner.fail('Gagal mendapatkan jawaban');
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async compareParfums() {
    console.log(chalk.blue.bold('\n⚖️ === BANDINGKAN PARFUM === ⚖️\n'));
    
    const parfumNames = this.parfumData.parfums.map(p => p.name);
    
    const questions = [
      {
        type: 'list',
        name: 'parfum1',
        message: 'Pilih parfum pertama:',
        choices: parfumNames
      },
      {
        type: 'list',
        name: 'parfum2',
        message: 'Pilih parfum kedua:',
        choices: parfumNames,
        validate: (input, answers) => input !== answers.parfum1 || 'Pilih parfum yang berbeda'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    const spinner = ora('Membandingkan parfum...').start();
    
    try {
      const comparison = await this.deepseek.compareParfums(answers.parfum1, answers.parfum2, this.parfumData);
      spinner.succeed('Perbandingan selesai!');
      
      console.log(chalk.green.bold(`\n📊 === ${answers.parfum1} VS ${answers.parfum2} === 📊\n`));
      console.log(chalk.white(comparison));
      
    } catch (error) {
      spinner.fail('Gagal membandingkan parfum');
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async searchParfums() {
    console.log(chalk.blue.bold('\n🔍 === CARI PARFUM === 🔍\n'));
    
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Masukkan kata kunci (nama, brand, atau kategori):',
        validate: input => input.length > 2 || 'Kata kunci minimal 3 karakter'
      }
    ]);

    try {
      const results = await this.dataManager.searchParfums(query);
      
      if (results.length === 0) {
        console.log(chalk.yellow('❌ Tidak ada parfum yang ditemukan dengan kata kunci tersebut.'));
        return;
      }

      console.log(chalk.green(`\n✅ Ditemukan ${results.length} parfum:\n`));
      
      const table = new Table({
        head: ['ID', 'Nama', 'Brand', 'Kategori', 'Gender', 'Price Range'],
        colWidths: [5, 20, 15, 18, 8, 12]
      });

      results.forEach(parfum => {
        table.push([
          parfum.id,
          parfum.name,
          parfum.brand,
          parfum.category,
          parfum.gender,
          parfum.price_range
        ]);
      });

      console.log(table.toString());
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async listAllParfums() {
    console.log(chalk.blue.bold('\n📋 === DAFTAR SEMUA PARFUM === 📋\n'));
    
    const table = new Table({
      head: ['ID', 'Nama', 'Brand', 'Kategori', 'Gender', 'Tahun'],
      colWidths: [5, 18, 15, 18, 8, 8]
    });

    this.parfumData.parfums.forEach(parfum => {
      table.push([
        parfum.id,
        parfum.name,
        parfum.brand,
        parfum.category,
        parfum.gender,
        parfum.year_released
      ]);
    });

    console.log(table.toString());
  }

  async showStats() {
    console.log(chalk.blue.bold('\n📊 === STATISTIK DATABASE === 📊\n'));
    
    const totalParfums = this.parfumData.parfums.length;
    const brandCount = new Set(this.parfumData.parfums.map(p => p.brand)).size;
    const categoryCount = new Set(this.parfumData.parfums.map(p => p.category)).size;
    
    const genderStats = this.parfumData.parfums.reduce((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {});

    console.log(chalk.cyan(`📈 Total Parfum: ${totalParfums}`));
    console.log(chalk.cyan(`🏢 Total Brand: ${brandCount}`));
    console.log(chalk.cyan(`🏷️  Total Kategori: ${categoryCount}`));
    console.log(chalk.cyan('\n👥 Distribution by Gender:'));
    
    Object.entries(genderStats).forEach(([gender, count]) => {
      console.log(chalk.white(`   ${gender}: ${count} parfum`));
    });
  }

  async continueOrExit() {
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Ingin melakukan aksi lain?',
        default: true
      }
    ]);

    if (shouldContinue) {
      console.log('\n' + '='.repeat(50) + '\n');
      await this.showMainMenu();
    } else {
      console.log(chalk.cyan('\nTerima kasih telah menggunakan AI Parfum Consultant! 👋'));
      process.exit(0);
    }
  }
}

// Run the application
const consultant = new AIParfumConsultant();
consultant.init().catch(error => {
  console.error(chalk.red(`❌ Fatal Error: ${error.message}`));
  process.exit(1);
});