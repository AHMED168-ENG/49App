import nodemailer from "nodemailer";



export function SendMails(data) {
    let transporter = nodemailer.createTransport({
        service:process.env.NODEMAILER_SERVICE,
        host: process.env.NODEMAILER_HOST,
        port: +process.env.NODEMAILER_PORT,
        secure: false, // true for port 465, false for other ports
        auth: {
          user: process.env.NODEMAILER_USERNAME,
          pass: process.env.NODEMAILER_PASSWORD,
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    });
    let mailOptions = {
      from: "zaza090977777@gmail.com",
      to: data.email,
      subject: data.subject,
      html: `<!DOCTYPE html>
    <html lang="en">
        <head>
            <title></title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="css/style.css" rel="stylesheet">
        </head>
        <body>
            <h3>welcome mr  ${data.fName} ${data.lName} in my application </h3>
            <p>We care about your safety</p>
            <p>${data.subject}</p>
            ${data.url ? `<a href='${data.url}'>click hir</a>` : ""}
            ${data.otp ? `<input class='' value='${data.otp}' style="padding:7px 15px ; border:1px solid #ddd;" />` : "" }
        </body>
    </html>`,
    };
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }