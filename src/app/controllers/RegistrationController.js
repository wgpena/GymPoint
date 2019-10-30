import * as Yup from 'yup';
import { parseISO, addMonths } from 'date-fns';

import Student from '../models/Student';
import Plan from '../models/Plan';
import Registration from '../models/Registration';

class RegistrationController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const registrations = await Registration.findAll({
      order: [['end_date', 'ASC']],
      attributes: ['id', 'start_date', 'end_date', 'price', 'expired'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title'],
        },
      ],
    });

    return res.json(registrations);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    const plan = await Plan.findByPk(plan_id);

    const parsedDate = parseISO(start_date);
    const endDateCalc = addMonths(parsedDate, plan.duration);
    const priceCalc = Number(plan.duration * plan.price).toFixed(2);

    const { id, end_date, price } = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date: endDateCalc,
      price: priceCalc,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    const plan = await Plan.findByPk(plan_id);

    const parsedDate = parseISO(start_date);
    const endDateCalc = addMonths(parsedDate, plan.duration);
    const priceCalc = Number(plan.duration * plan.price).toFixed(2);

    const registration = await Registration.findByPk(req.params.id);

    const { id, end_date, price } = await registration.update({
      student_id,
      plan_id,
      start_date,
      end_date: endDateCalc,
      price: priceCalc,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);

    await registration.destroy();

    return res.send();
  }
}

export default new RegistrationController();
