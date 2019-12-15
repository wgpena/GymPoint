import * as Yup from 'yup';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

import HelpOrderMail from '../jobs/HelpOrderMail';
import Queue from '../../lib/Queue';

class HelpOrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const helpOrders = await HelpOrder.findAll({
      where: {
        student_id: req.params.studentId,
      },
      attributes: ['id', 'question', 'answer', 'answer_at', 'created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(helpOrders);
  }

  async store(req, res) {
    const student_id = req.params.studentId;

    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, question, created_at } = await HelpOrder.create({
      student_id,
      question: req.body.question,
    });

    return res.json({
      id,
      student_id,
      question,
      created_at,
    });
  }

  async update(req, res) {
    const id = req.params.helpOrderId;

    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const answerAt = new Date();

    const helpOrder = await HelpOrder.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    helpOrder.answer = req.body.answer;
    helpOrder.answer_at = answerAt;

    await helpOrder.update();

    await Queue.add(HelpOrderMail.key, {
      helpOrder,
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
