const request = require('supertest');
const examModel = require('../models/examModel');
const questionModel = require('../models/questionModel');
const SubjectModel = require('../models/subjectModel');

// Mock dependencies
jest.mock('../models/examModel');
jest.mock('../models/questionModel');
jest.mock('../models/subjectModel');
jest.mock('../config/db', () => ({
  connectWithRetry: jest.fn(),
}));

// Import app
const app = require('../index');

describe('Exam Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/exams/create', () => {
        it('should create an exam successfully', async () => {
            // Mock Data
            const mockQuestions = [{
                questionType: 'MCQ',
                questionText: 'Test Question',
                options: ['A', 'B'],
                correctAnswers: ['A'],
            }];
            
            const reqBody = {
                subject: 'MathId',
                subTopic: 'AlgebraId',
                level: 'Easy',
                status: 'Active',
                questions: mockQuestions,
                passPercentage: 50
            };

            // Setup Mocks
            examModel.findOne.mockResolvedValue(null); // No existing exam with same details, no existing examCode
            questionModel.create.mockResolvedValue([{ _id: 'q1', ...mockQuestions[0] }]);
            examModel.create.mockResolvedValue({
                _id: 'exam1',
                ...reqBody,
                questions: ['q1'],
                examCode: 'ABC1234'
            });

            const res = await request(app)
                .post('/api/exams/create')
                .send(reqBody);

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(questionModel.create).toHaveBeenCalled();
            expect(examModel.create).toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/exams/create')
                .send({}); // Empty body

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /api/exams/getAll', () => {
      it('should fetch all exams', async () => {
        // Mock Data
        const mockExam = {
          _id: 'exam1',
          subject: 'MathId', // in DB it stores ID
          subTopic: 'AlgebraId',
          level: 'Easy',
          status: 'Active',
          passPercentage: 50,
          examCode: 'ABCDE',
          questions: [],
        };

        // Mock Find Chain
        const mockPopulate = jest.fn().mockResolvedValue([mockExam]);
        examModel.find.mockReturnValue({ populate: mockPopulate });

        // Mock Subject Lookup
        SubjectModel.findById.mockResolvedValue({
          _id: 'MathId',
          name: 'Mathematics',
          subtopics: [{ _id: 'AlgebraId', name: 'Algebra' }]
        });

        const res = await request(app).get('/api/exams/getAll');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].subject).toBe('Mathematics'); // Verified hydration
      });
    });
});
