import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/parfums.json');
  }

  async loadParfumData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Error loading parfum data: ${error.message}`);
    }
  }

  async saveParfumData(data) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Error saving parfum data: ${error.message}`);
    }
  }

  async searchParfums(query) {
    const data = await this.loadParfumData();
    const lowercaseQuery = query.toLowerCase();
    
    return data.parfums.filter(parfum => 
      parfum.name.toLowerCase().includes(lowercaseQuery) ||
      parfum.brand.toLowerCase().includes(lowercaseQuery) ||
      parfum.category.toLowerCase().includes(lowercaseQuery) ||
      parfum.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getParfumById(id) {
    const data = await this.loadParfumData();
    return data.parfums.find(parfum => parfum.id === id);
  }

  async getParfumsByBrand(brand) {
    const data = await this.loadParfumData();
    return data.parfums.filter(parfum => 
      parfum.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  async getParfumsByCategory(category) {
    const data = await this.loadParfumData();
    return data.parfums.filter(parfum => 
      parfum.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  async getParfumsByGender(gender) {
    const data = await this.loadParfumData();
    return data.parfums.filter(parfum => 
      parfum.gender.toLowerCase() === gender.toLowerCase() ||
      parfum.gender.toLowerCase() === 'unisex'
    );
  }

  async addParfum(parfumData) {
    const data = await this.loadParfumData();
    const newId = (Math.max(...data.parfums.map(p => parseInt(p.id))) + 1).toString();
    
    const newParfum = {
      id: newId,
      ...parfumData
    };
    
    data.parfums.push(newParfum);
    await this.saveParfumData(data);
    return newParfum;
  }

  async updateParfum(id, parfumData) {
    const data = await this.loadParfumData();
    const index = data.parfums.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error(`Parfum dengan ID ${id} tidak ditemukan`);
    }
    
    data.parfums[index] = { ...data.parfums[index], ...parfumData };
    await this.saveParfumData(data);
    return data.parfums[index];
  }

  async deleteParfum(id) {
    const data = await this.loadParfumData();
    const index = data.parfums.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error(`Parfum dengan ID ${id} tidak ditemukan`);
    }
    
    const deletedParfum = data.parfums.splice(index, 1)[0];
    await this.saveParfumData(data);
    return deletedParfum;
  }

  async getAllBrands() {
    const data = await this.loadParfumData();
    return data.brands;
  }

  async getAllCategories() {
    const data = await this.loadParfumData();
    return data.categories;
  }
}

export default DataManager;