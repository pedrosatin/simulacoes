const fs = require('fs');
const path = require('path');

// Read the js file and evaluate it so we can test the function
const jsCode = fs.readFileSync(path.join(__dirname, 'rescisao-trabalhista.js'), 'utf8');

// Mock document and other globals before evaluating
global.document = {
  addEventListener: jest.fn(),
  getElementById: jest.fn(() => ({
    value: '',
    addEventListener: jest.fn(),
    style: {}
  }))
};
global.window = {};

// Use eval to expose the function. In a real app we'd use module.exports,
// but since this is a frontend script without exports, we use eval in a context.
eval(jsCode);

describe('calculateThirteenthSalary', () => {
  it('should return 0 for justa causa', () => {
    const dados = {
      tipoRescisao: 'demissao-justa-causa',
      dataRescisao: new Date('2023-12-15'),
      dataAdmissao: new Date('2023-01-01'),
      salario: 1200
    };
    expect(calculateThirteenthSalary(dados, null)).toBe(0);
  });

  describe('when admitted in a previous year', () => {
    it('should calculate proportional correctly when termination day >= 15', () => {
      // Termination on March 15th -> January, February, and March should count (3 months)
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-03-15T12:00:00'),
        dataAdmissao: new Date('2020-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 3 = 100 * 3 = 300
      expect(calculateThirteenthSalary(dados, null)).toBe(300);
    });

    it('should calculate proportional correctly when termination day < 15', () => {
      // Termination on March 14th -> January and February count, March does NOT (2 months)
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-03-14T12:00:00'),
        dataAdmissao: new Date('2020-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 2 = 100 * 2 = 200
      expect(calculateThirteenthSalary(dados, null)).toBe(200);
    });
  });

  describe('when admitted in the same year', () => {
    it('should calculate proportional correctly when termination day >= 15', () => {
      // Admission on Jan 1st, Termination on March 15th -> Jan, Feb, Mar (3 months)
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-03-15T12:00:00'),
        dataAdmissao: new Date('2023-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 3 = 300
      expect(calculateThirteenthSalary(dados, null)).toBe(300);
    });

    it('should calculate proportional correctly when termination day < 15', () => {
      // Admission on Jan 1st, Termination on March 14th -> Jan, Feb count, Mar does NOT (2 months)
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-03-14T12:00:00'),
        dataAdmissao: new Date('2023-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 2 = 200
      expect(calculateThirteenthSalary(dados, null)).toBe(200);
    });

    it('should handle admission and termination in the same month when termination day >= 15', () => {
      // Admission Jan 1st, Termination Jan 15th -> 1 month
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-01-15T12:00:00'),
        dataAdmissao: new Date('2023-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 1 = 100
      expect(calculateThirteenthSalary(dados, null)).toBe(100);
    });

    it('should return 0 when admitted and terminated in the same month but termination day < 15', () => {
      // Admission Jan 1st, Termination Jan 14th -> 0 months
      const dados = {
        tipoRescisao: 'demissao-sem-justa-causa',
        dataRescisao: new Date('2023-01-14T12:00:00'),
        dataAdmissao: new Date('2023-01-01T12:00:00'),
        salario: 1200
      };
      // (1200 / 12) * 0 = 0
      expect(calculateThirteenthSalary(dados, null)).toBe(0);
    });
  });
});
