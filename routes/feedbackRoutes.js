const mailjet = require('node-mailjet').apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);


const sendEmail = async (to, subject, message) => {
  try {
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: "fabioast47@hotmail.com",
            Name: "Fabio Steyer",
          },
          To: [
            {
              Email: to,
              Name: "Destinatário",
            },
          ],
          Subject: subject,
          HTMLPart: `<p>${message}</p>`,
        },
      ],
    });

    const result = await request;
    console.log("E-mail enviado com sucesso:", result.body);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
  }
};

// Exemplo de uso
sendEmail("destinatario@exemplo.com", "Assunto do E-mail", "Mensagem do e-mail.");
