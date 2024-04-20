import SibApiV3Sdk from "sib-api-v3-sdk";
const defaultClient = SibApiV3Sdk.ApiClient.instance;
import dotenv from "dotenv";
dotenv.config();
// Configure API key authorization: api-key
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SIB_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

export const sendAnyEmail = async (data) => {
  sendSmtpEmail.templateId = 4;
  sendSmtpEmail.subject = data.subject;
  sendSmtpEmail.sender = {
    name: "49App",
    email: "49App@49App.com",
  };
  sendSmtpEmail.to = [
    {
      email: data.email,
    },
  ];
  sendSmtpEmail.params = {
    OTP: data.otp,
    fName: data.fName,
    lName: data.lName,
    subject: data.subject,
    body: data.body,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail).catch((error) => {
    console.error("Error sending verification email:", error.message);
    throw error;
  });

  console.log("API called successfully. Returned data:", data);
};
