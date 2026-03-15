import axios from "axios";

/**
 * WhatsApp Helper for DEZA - Using Meta Cloud API (Official)
 * Much more professional than SMS.
 */
export const sendWhatsApp = async (phone, templateName, variables = []) => {
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken || !phoneNumberId) {
            console.warn("⚠️ WhatsApp API credentials missing in .env, skipping WhatsApp.");
            return false;
        }

        // Ensure 10-digit phone with 91 prefix
        let cleanPhone = String(phone).replace(/\D/g, "");
        if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

        const data = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
                name: templateName,
                language: { code: "en_US" },
                components: [
                    {
                        type: "body",
                        parameters: variables.map(v => ({ type: "text", text: String(v) }))
                    }
                ]
            }
        };

        await axios.post(url, data, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`🟢 WhatsApp notification triggered for ${cleanPhone}`);
        return true;
    } catch (err) {
        console.error("🚨 WhatsApp Error:", err.response?.data || err.message);
        return false;
    }
};
