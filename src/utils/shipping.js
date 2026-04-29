/**
 * Shipping Utility for DEZA Luxury Perfumes
 * Calculates shipping rates from Mumbai (Hub) to any Indian Pincode
 */

export const calculateShipping = async (pincode) => {
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
        return { success: false, message: "Invalid Pincode" };
    }

    try {
        // Fetch real location data from Zippopotam or Postal API
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (!data[0] || data[0].Status !== "Success") {
            return { success: false, message: "Service not available for this location" };
        }

        const details = data[0].PostOffice[0];
        const city = details.District;
        const state = details.State;
        const firstDigit = pincode[0];
        const firstTwo = pincode.substring(0, 2);
        const firstThree = pincode.substring(0, 3);

        let charge = 100; // Default Standard
        let days = "5 - 7 Business Days";
        let zone = "National";

        // Logic based on Mumbai as Origin (Pincode 400xxx)
        if (firstThree >= "400" && firstThree <= "404") {
            // Mumbai Local
            charge = 40;
            days = "1 - 2 Business Days";
            zone = "Mumbai Local";
            if (pincode === "400080") { // specific hub check
                 days = "Same-day Delivery!";
                 charge = 0; // Free for very close areas maybe? Or nominal
            }
        } else if (firstDigit === "4") {
            // Maharashtra & Goa (Regional)
            charge = 60;
            days = "2 - 3 Business Days";
            zone = "Regional (West)";
        } else if (["3", "5", "6"].includes(firstDigit)) {
            // Neighboring Regions (South & Central)
            charge = 80;
            days = "3 - 5 Business Days";
            zone = "Inter-State";
        } else if (["1", "2", "7", "8", "9"].includes(firstDigit)) {
            // North, East, North-East
            charge = 120;
            days = "5 - 9 Business Days";
            zone = "National (Long Distance)";
            
            // Remote Areas check
            if (["18", "19", "78", "79"].includes(firstTwo)) {
                charge = 180;
                days = "7 - 12 Business Days";
                zone = "Remote / North-East";
            }
        }

        return {
            success: true,
            charge,
            days,
            city,
            state,
            zone,
            pincode
        };
    } catch (error) {
        console.error("Shipping Calculation Error:", error);
        return { success: false, message: "Network Error" };
    }
};
