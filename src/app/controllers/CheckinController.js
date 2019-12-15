import { Op } from 'sequelize';
import { subDays } from 'date-fns';

import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.studentId,
      },
      attributes: ['id', 'student_id', 'created_at'],
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

    return res.json(checkins);
  }

  async store(req, res) {
    const student_id = req.params.studentId;

    const count = await Checkin.count({
      where: {
        student_id,
        created_at: {
          [Op.lte]: new Date(),
          [Op.gte]: subDays(new Date(), 7),
        },
      },
    });

    if (count >= 5) {
      return res
        .status(400)
        .json({ error: 'Exceeded 5 checkins per week limit' });
    }

    const { id, created_at } = await Checkin.create({ student_id });

    return res.json({
      id,
      student_id,
      created_at,
    });
  }
}

export default new CheckinController();
