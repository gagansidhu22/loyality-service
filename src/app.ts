import express, { Request, Response, Express } from "express";

/**
 * Interface representing a customer.
 */
interface Customer {
    id: number;
    name: string;
    status: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
    points: number;
    lastPurchaseDate: string;
    email?: string;
    preferredStore?: string; // Customer's designated preferred store
    joinDate: string;
    notifications: boolean;
    lastStatusChange: string;
}

/**
 * Interface representing a purchase.
 */
interface Purchase {
    customerId: number;
    amount: number;
    storeId: string;
    date: string;
}

const app: Express = express();
app.use(express.json());

let customers: Customer[] = [];
let purchases: Purchase[] = [];

/**
 * Helper function to get multiplier based on status.
 */
function getStatusMultiplier(status: Customer["status"]): number {
    switch (status) {
        case "PLATINUM":
            return 2.0;
        case "GOLD":
            return 1.5;
        case "SILVER":
            return 1.25;
        default:
            return 1.0;
    }
}

/**
 * Calculate points for a purchase, applying status and preferred store multipliers.
 */
function calculatePoints(customer: Customer, purchase: Purchase): number {
    let multiplier = getStatusMultiplier(customer.status);

    // Apply preferred store bonus if applicable
    if (customer.preferredStore && purchase.storeId === customer.preferredStore) {
        multiplier *= 1.25;
    }

    // Respect the 3x cap
    if (multiplier > 3.0) {
        multiplier = 3.0;
    }

    return Math.floor(purchase.amount * multiplier);
}

/**
 * API to record a purchase.
 */
app.post("/purchase", (req: Request, res: Response) => {
    const { customerId, amount, storeId } = req.body;
    const customer = customers.find(c => c.id === customerId);

    if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
    }

    const purchase: Purchase = {
        customerId,
        amount,
        storeId,
        date: new Date().toISOString()
    };

    const earnedPoints = calculatePoints(customer, purchase);
    customer.points += earnedPoints;
    customer.lastPurchaseDate = purchase.date;

    purchases.push(purchase);

    return res.json({
        message: "Purchase recorded successfully",
        earnedPoints,
        totalPoints: customer.points,
        store: storeId
    });
});

/**
 * API to set a customer's preferred store.
 */
app.post("/customer/:id/preferred-store", (req: Request, res: Response) => {
    const customerId = parseInt(req.params.id);
    const { storeId } = req.body;

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
    }

    customer.preferredStore = storeId;
    return res.json({
        message: "Preferred store updated",
        customerId: customer.id,
        preferredStore: storeId
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
