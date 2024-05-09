import Agenda from 'agenda';
import {scheduleUserInstallments} from './scheduleUserInstallments.js';
export const agenda = new Agenda({ db: { address: process.env.MONGODB_URI_REFACTOR } });

scheduleUserInstallments(agenda)

