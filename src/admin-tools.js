#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { v4 as uuidv4 } from 'uuid';
import DataManager from './data-manager.js';

class AdminTools {
  constructor() {
    this.dataManager = new DataManager();
    this.parfumData = null;
  }

  async init() {
    try {
      console.log(chalk.magenta.bold('\n🔧 === ADMIN TOOLS - PARFUM DATABASE === 🔧\n'));
      console.log(chalk.yellow('Memuat data parfum...'));
      
      this.parfumData = await this.dataManager.loadParfumData();
      
      console.log(chalk.green(`✅ Data berhasil dimuat: ${this.parfumData.parfums.length} parfum\n`));
      
      await this.showMainMenu();
    } catch (error) {
      console.error(chalk.red(`❌ Error saat inisialisasi: ${error.message}`));
      process.exit(1);
    }
  }

  async showMainMenu() {
    const choices = [
      { name: '➕ Tambah Parfum Baru', value: 'add' },
      { name: '✏️  Edit Parfum', value: 'edit' },
      { name: '🗑️  Hapus Parfum', value: 'delete' },
      { name: '📋 Lihat Semua Parfum', value: 'list' },
      { name: '🔍 Cari Parfum', value: 'search' },
      { name: '📊 Statistik Database', value: 'stats' },
      { name: '💾 Backup Database', value: 'backup' },
      { name: '🚪 Keluar', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Pilih aksi admin:',
        choices
      }
    ]);

    await this.handleAction(action);
  }

  async handleAction(action) {
    switch (action) {
      case 'add':
        await this.addParfum();
        break;
      case 'edit':
        await this.editParfum();
        break;
      case 'delete':
        await this.deleteParfum();
        break;
      case 'list':
        await this.listAllParfums();
        break;
      case 'search':
        await this.searchParfums();
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'backup':
        await this.backupDatabase();
        break;
      case 'exit':
        console.log(chalk.magenta('Admin tools ditutup! 👋'));
        process.exit(0);
        break;
    }
    
    await this.continueOrExit();
  }

  async addParfum() {
    console.log(chalk.blue.bold('\n➕ === TAMBAH PARFUM BARU === ➕\n'));
    
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Nama parfum:',
        validate: input => input.length > 2 || 'Nama parfum minimal 3 karakter'
      },
      {
        type: 'input',
        name: 'brand',
        message: 'Brand:',
        validate: input => input.length > 1 || 'Brand tidak boleh kosong'
      },
      {
        type: 'input',
        name: 'category',
        message: 'Kategori (e.g., Floral Oriental, Woody Aromatic):',
        validate: input => input.length > 2 || 'Kategori minimal 3 karakter'
      },
      {
        type: 'list',
        name: 'gender',
        message: 'Gender:',
        choices: ['Men', 'Women', 'Unisex']
      },
      {
        type: 'input',
        name: 'top_notes',
        message: 'Top notes (pisahkan dengan koma):',
        validate: input => input.length > 3 || 'Top notes tidak boleh kosong'
      },
      {
        type: 'input',
        name: 'middle_notes',
        message: 'Middle notes (pisahkan dengan koma):',
        validate: input => input.length > 3 || 'Middle notes tidak boleh kosong'
      },
      {
        type: 'input',
        name: 'base_notes',
        message: 'Base notes (pisahkan dengan koma):',
        validate: input => input.length > 3 || 'Base notes tidak boleh kosong'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Deskripsi parfum:',
        validate: input => input.length > 10 || 'Deskripsi minimal 10 karakter'
      },
      {
        type: 'list',
        name: 'price_range',
        message: 'Price range:',
        choices: ['low', 'medium', 'medium-high', 'high', 'luxury']
      },
      {
        type: 'input',
        name: 'longevity',
        message: 'Longevity (e.g., 6-8 hours):',
        validate: input => input.length > 3 || 'Longevity tidak boleh kosong'
      },
      {
        type: 'list',
        name: 'sillage',
        message: 'Sillage:',
        choices: ['light', 'moderate', 'moderate-heavy', 'heavy']
      },
      {
        type: 'input',
        name: 'season',
        message: 'Season (e.g., all, spring-summer, fall-winter):',
        default: 'all'
      },
      {
        type: 'input',
        name: 'occasion',
        message: 'Occasion (e.g., casual, formal, night):',
        default: 'casual'
      },
      {
        type: 'number',
        name: 'year_released',
        message: 'Tahun rilis:',
        validate: input => input >= 1800 && input <= new Date().getFullYear() || 'Tahun tidak valid'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    const parfumData = {
      name: answers.name,
      brand: answers.brand,
      category: answers.category,
      gender: answers.gender,
      notes: {
        top: answers.top_notes.split(',').map(note => note.trim()),
        middle: answers.middle_notes.split(',').map(note => note.trim()),
        base: answers.base_notes.split(',').map(note => note.trim())
      },
      description: answers.description,
      price_range: answers.price_range,
      longevity: answers.longevity,
      sillage: answers.sillage,
      season: answers.season,
      occasion: answers.occasion,
      year_released: answers.year_released
    };

    try {
      const newParfum = await this.dataManager.addParfum(parfumData);
      console.log(chalk.green(`\n✅ Parfum "${newParfum.name}" berhasil ditambahkan dengan ID: ${newParfum.id}`));
      
      // Reload data
      this.parfumData = await this.dataManager.loadParfumData();
      
    } catch (error) {
      console.error(chalk.red(`❌ Error menambahkan parfum: ${error.message}`));
    }
  }

  async editParfum() {
    console.log(chalk.blue.bold('\n✏️ === EDIT PARFUM === ✏️\n'));
    
    await this.listAllParfums();
    
    const { parfumId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'parfumId',
        message: 'Masukkan ID parfum yang ingin diedit:',
        validate: async (input) => {
          const parfum = await this.dataManager.getParfumById(input);
          return parfum ? true : 'Parfum dengan ID tersebut tidak ditemukan';
        }
      }
    ]);

    const parfum = await this.dataManager.getParfumById(parfumId);
    
    console.log(chalk.yellow(`\nParfum yang akan diedit: ${parfum.name} - ${parfum.brand}\n`));
    
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Nama parfum:',
        default: parfum.name
      },
      {
        type: 'input',
        name: 'brand',
        message: 'Brand:',
        default: parfum.brand
      },
      {
        type: 'input',
        name: 'category',
        message: 'Kategori:',
        default: parfum.category
      },
      {
        type: 'list',
        name: 'gender',
        message: 'Gender:',
        choices: ['Men', 'Women', 'Unisex'],
        default: parfum.gender
      },
      {
        type: 'input',
        name: 'description',
        message: 'Deskripsi:',
        default: parfum.description
      },
      {
        type: 'list',
        name: 'price_range',
        message: 'Price range:',
        choices: ['low', 'medium', 'medium-high', 'high', 'luxury'],
        default: parfum.price_range
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    try {
      const updatedParfum = await this.dataManager.updateParfum(parfumId, answers);
      console.log(chalk.green(`\n✅ Parfum "${updatedParfum.name}" berhasil diupdate!`));
      
      // Reload data
      this.parfumData = await this.dataManager.loadParfumData();
      
    } catch (error) {
      console.error(chalk.red(`❌ Error mengupdate parfum: ${error.message}`));
    }
  }

  async deleteParfum() {
    console.log(chalk.blue.bold('\n🗑️ === HAPUS PARFUM === 🗑️\n'));
    
    await this.listAllParfums();
    
    const { parfumId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'parfumId',
        message: 'Masukkan ID parfum yang ingin dihapus:',
        validate: async (input) => {
          const parfum = await this.dataManager.getParfumById(input);
          return parfum ? true : 'Parfum dengan ID tersebut tidak ditemukan';
        }
      }
    ]);

    const parfum = await this.dataManager.getParfumById(parfumId);
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Yakin ingin menghapus parfum "${parfum.name}" - ${parfum.brand}?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Penghapusan dibatalkan.'));
      return;
    }

    try {
      const deletedParfum = await this.dataManager.deleteParfum(parfumId);
      console.log(chalk.green(`\n✅ Parfum "${deletedParfum.name}" berhasil dihapus!`));
      
      // Reload data
      this.parfumData = await this.dataManager.loadParfumData();
      
    } catch (error) {
      console.error(chalk.red(`❌ Error menghapus parfum: ${error.message}`));
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

  async searchParfums() {
    console.log(chalk.blue.bold('\n🔍 === CARI PARFUM === 🔍\n'));
    
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Masukkan kata kunci pencarian:',
        validate: input => input.length > 2 || 'Kata kunci minimal 3 karakter'
      }
    ]);

    try {
      const results = await this.dataManager.searchParfums(query);
      
      if (results.length === 0) {
        console.log(chalk.yellow('❌ Tidak ada parfum yang ditemukan.'));
        return;
      }

      console.log(chalk.green(`\n✅ Ditemukan ${results.length} parfum:\n`));
      
      const table = new Table({
        head: ['ID', 'Nama', 'Brand', 'Kategori', 'Gender'],
        colWidths: [5, 20, 15, 18, 8]
      });

      results.forEach(parfum => {
        table.push([
          parfum.id,
          parfum.name,
          parfum.brand,
          parfum.category,
          parfum.gender
        ]);
      });

      console.log(table.toString());
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
    }
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

    const priceStats = this.parfumData.parfums.reduce((acc, p) => {
      acc[p.price_range] = (acc[p.price_range] || 0) + 1;
      return acc;
    }, {});

    console.log(chalk.cyan(`📈 Total Parfum: ${totalParfums}`));
    console.log(chalk.cyan(`🏢 Total Brand: ${brandCount}`));
    console.log(chalk.cyan(`🏷️ Total Kategori: ${categoryCount}`));
    
    console.log(chalk.cyan('\n👥 Distribution by Gender:'));
    Object.entries(genderStats).forEach(([gender, count]) => {
      console.log(chalk.white(`   ${gender}: ${count} parfum`));
    });
    
    console.log(chalk.cyan('\n💰 Distribution by Price Range:'));
    Object.entries(priceStats).forEach(([price, count]) => {
      console.log(chalk.white(`   ${price}: ${count} parfum`));
    });
  }

  async backupDatabase() {
    console.log(chalk.blue.bold('\n💾 === BACKUP DATABASE === 💾\n'));
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./data/backup-parfums-${timestamp}.json`;
      
      await this.dataManager.saveParfumData(this.parfumData);
      
      // Copy to backup location (simplified)
      const fs = await import('fs/promises');
      await fs.copyFile('./data/parfums.json', backupPath);
      
      console.log(chalk.green(`✅ Backup berhasil disimpan: ${backupPath}`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Error backup: ${error.message}`));
    }
  }

  async continueOrExit() {
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Lanjutkan administrasi?',
        default: true
      }
    ]);

    if (shouldContinue) {
      console.log('\n' + '='.repeat(50) + '\n');
      await this.showMainMenu();
    } else {
      console.log(chalk.magenta('\nAdmin tools ditutup! 👋'));
      process.exit(0);
    }
  }
}

// Run the admin tools
const admin = new AdminTools();
admin.init().catch(error => {
  console.error(chalk.red(`❌ Fatal Error: ${error.message}`));
  process.exit(1);
});