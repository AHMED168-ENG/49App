import express from 'express';
import createError from 'http-errors';
import morgan from 'morgan';
import mongoose from 'mongoose'
import firebaseAdmin from "firebase-admin";
import dynamic_prop_model from './models/dynamic_prop_model.js';
import { runEvery12AM, checkUsersBalanceStorage, calcFiveAndTenYears } from './controllers/cron_controller.js';
import cron from 'node-cron';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dontenv from 'dotenv'

import auth from './routes/auth.js'
import profile from './routes/user_profile.js'
import ads from './routes/ad.js'
import favorites from './routes/favorite.js'
import notifications from './routes/notification.js'
import cashBack from './routes/cash_back.js'
import subscriptions from './routes/subscription.js'
import payment from './routes/payment.js'
import addressRoute from './routes/address.js'

import ride from './routes/services/ride.js'
import food from './routes/services/food.js'
import health from './routes/services/health.js'

import loading from './routes/services/loading.js'
import posts from './routes/social/post.js'
import categories from './routes/categories.js'

import report from './routes/social/report.js'
import search from './routes/social/search.js'
import peerProfile from './routes/social/peer_profile.js'
import hiddenOpinion from './routes/social/hidden_opinion.js'
import list from './routes/social/list.js'
import tinder from './routes/social/tinder.js'
import gift from './routes/social/gift.js'
import reel from './routes/social/reel.js'
import appRadio from './routes/app_radio.js'

import chat from './routes/social/chat.js'
import contests from './routes/contests.js'

import dashboardAuth from './routes/dashboard/auth.js'
import dashboardSuperAdmin from './routes/dashboard/super_admin.js'
import dashboardAdmin from './routes/dashboard/admin.js'
import { getPublicIPAddress } from './helper.js';
import payout from './routes/payout.js'
import { calculateWithPaymob } from './controllers/accounts_controller.js';
import { rideCategoryId } from './controllers/ride_controller.js';
import rider_model from './models/rider_model.js';
import user_model from './models/user_model.js';
import { sendNotification } from './controllers/notification_controller.js';
import come_with_me_ride_model from './models/come_with_me_ride_model.js';
import pick_me_ride_model from './models/pick_me_ride_model.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const serviceAccount = __dirname + "/serviceAccountKey.json";

dontenv.config()

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: false,
  })
  .then(() => {
    console.log('Database Connected')

    //user_model.updateMany({}, { is_online: false }).exec()

    cron.schedule('0 0 * * *', async () => {
      console.log('Cron 12 AM is Running')
      await runEvery12AM()
      await checkUsersBalanceStorage()
      console.log('Cron 12 AM is Finished')
    })

    cron.schedule('0 12 * * *', async () => {
      console.log('Cron 12 PM is Running')
      await checkUsersBalanceStorage()
      console.log('Cron 12 PM is Finished')
    })

    cron.schedule("0 0 1 * *", async () => { // every Month
      console.log('Cron Every Month is Running')
      await calcFiveAndTenYears()
      console.log('Cron Every Month is Finished')
    });

    getPublicIPAddress()
    test()


  }).catch((e) => {
    console.error(e)
  });

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

app.use('/auth', auth);
app.use('/profile', profile);
app.use('/ads', ads);
app.use('/favorites', favorites);
app.use('/notifications', notifications);
app.use('/cash-back', cashBack);
app.use('/subscriptions', subscriptions);
app.use('/payment', payment);
app.use('/address', addressRoute);


app.use('/social/report', report);
app.use('/social/search', search);
app.use('/social/profile', peerProfile);
app.use('/social/hidden-opinions', hiddenOpinion);
app.use('/social/lists', list);
app.use('/social/tinder', tinder);
app.use('/social/gift', gift);
app.use('/social/posts', posts);
//app.use('/social/reels', reel);
app.use('/social/chat', chat);


app.use('/services/ride', ride);
app.use('/services/loading', loading);
app.use('/services/food', food);
app.use('/services/health', health);

app.use('/categories', categories);
app.use('/app-radio', appRadio);
app.use('/payout', payout);
app.use('/contests', contests);

// app.use('/dashboard/', (req, res, next) => {

//   if (req.headers.key == process.env.DASHBOARD_API_KEY) {

//     return next()

//   } else {
//     return res.sendStatus(404)
//   }
// })

app.use('/dashboard/auth', dashboardAuth)
app.use('/dashboard/super-admin', dashboardSuperAdmin)
app.use('/dashboard/admin', dashboardAdmin)
app.use(express.static(__dirname + '/public'))

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  if (err == 'Bad Request') res.status(400)
  else
    res.status(err.status || 500);
  res.send({
    status: false,
    message: err.message ?? err,
  });
});


async function test() {

  //likeCashBack('62ee88aa1f14ec01e8dff4a0')
  /*const result = await sub_category_model.find({ parent: '62c8b5b09332225799fe335c' })

  for (const item of result) {
    console.log(`${item.name_en} => ${item.index} => ${item.picture}`)
  }*/
  /*sub_category_model.find({ parent: '62c8b5a29332225799fe3346' }).sort('index').then(all => {

    var index = 1
    for (const one of all) {
      console.log(`${one.name_en} => ${one.id}`)

      sub_category_model.updateOne({
        _id: one.id,
      }, {
        index,
        picture: `main/29/${index}.png`
      }).exec()

      index++
    }
  })*/

  /*const mainCategories = await main_category_model.find({}).sort('index').select('name_ar index')

  for (const mainCategory of mainCategories) {

    const categories = await sub_category_model.find({ parent: mainCategory.id, is_hidden: false }).sort('index').select('name_ar index')


    for (const category of categories) {

      console.log(`${category.name_ar} ${category.id} => ${category.index}`)
      sub_category_model.updateOne({
        _id: category.id,
      }, { picture: `main/${mainCategory.index}/${category.index}.png` }).exec()
    }

  }*/

  /*for (var i = 1; i < 121; i++) {

    console.log(i)
    if (i == 10) {
      await wallet_model.updateOne({ _id: '62cdb5bebb2c7ee50473e9b4' }, { monthly_balance: 100 })
    }
    if (i == 20) {
      await wallet_model.updateOne({ _id: '62cdb5bebb2c7ee50473e9b4' }, { monthly_balance: 50 })
    }
    if (i == 40) {
      await wallet_model.updateOne({ _id: '62cdb5bebb2c7ee50473e9b4' }, { monthly_balance: 100 })
    }
    if (i == 60) {
      await wallet_model.updateOne({ _id: '62cdb5bebb2c7ee50473e9b4' }, { monthly_balance: 100 })
    }
    if (i == 100) {
      await wallet_model.updateOne({ _id: '62cdb5bebb2c7ee50473e9b4' }, { monthly_balance: 300 })
    }
    await calcFiveAndTenYears()
  }*/

  /*const startBalances = [20]

  for (var i = 0; i < 119; i++) {
    startBalances.push(0)
  }

  console.log(`Length ${startBalances.length}`)
  var total = 0

  const interest = 6

  startBalances.forEach(grossMoney => {

    const startBalance = grossMoney / 10
    const generatedBalance = total
    const profit = ((total * interest) / 100) / 12

    total = startBalance + generatedBalance + profit

  })
  console.log(`Total ${total}`)*/
}

// function test2() {
//   const categoryId = '62c8bafb8e28a58a3edf589b'

//   const textField = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'السعر',
//     name_en: 'Price',
//     type: 3,
//     index: 1,
//   })
//   textField.save()

//   const dropDown = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'الانواع',
//     name_en: 'Types',
//     type: 4,
//     index: 2,
//     selections: [{ 'ar': 'Ar Value 1', 'en': 'En Value 1' }, { 'ar': 'Ar Value 2', 'en': 'En Value 2' }, { 'ar': 'Ar Value 3', 'en': 'En Value 3' }]
//   })
//   dropDown.save()

//   const datePicker = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'تاريخ',
//     name_en: 'Date',
//     type: 5,
//     index: 4,
//   })
//   datePicker.save()

//   const dayPicker = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'اليوم',
//     name_en: 'Day',
//     type: 6,
//     index: 5,
//   })
//   dayPicker.save()

//   const videoPicker = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'فيديو',
//     name_en: 'Video',
//     type: 7,
//     index: 6,
//   })
//   videoPicker.save()

//   const pdfPicker = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'بي دي اف',
//     name_en: 'PDF',
//     type: 8,
//     index: 7,
//   })

//   pdfPicker.save()

//   const checkBox = new dynamic_prop_model({
//     sub_category_id: categoryId,
//     name_ar: 'الانواع',
//     name_en: 'Types',
//     type: 9,
//     index: 9,
//     selections: [{ 'ar': 'Ar Value 1', 'en': 'En Value 1' }, { 'ar': 'Ar Value 2', 'en': 'En Value 2' }, { 'ar': 'Ar Value 3', 'en': 'En Value 3' }]
//   })
//   checkBox.save()

// }

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
