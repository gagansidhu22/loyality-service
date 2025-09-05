import express, { Request, Response, Express } from "express";
 
/**

* Interface representing a customer.

*/

interface Customer {

    id: number;

    name: string;

    status: "GOLD" | "SILVER" | "BRONZE" | "PLATINUM";

    points: number;

    lastPurchaseDate: string;

    email?: string;

    preferredStore?: string;

    joinDate: string;

    notifications: boolean;

    lastStatusChange?: string;

}
 
const customers: Customer[] = [

    {

        id: 1,

        name: "John Smith",

        status: "SILVER",

        points: 450,

        lastPurchaseDate: "2024-02-15",

        joinDate: "2023-06-15",

        notifications: true,

        preferredStore: "Downtown",

    },

    {

        id: 2,

        name: "Jane Doe",

        status: "GOLD",

        points: 850,

        lastPurchaseDate: "2024-03-01",

        email: "jane.doe@email.com",

        joinDate: "2023-01-20",

        notifications: false,

    },

];
 
const app: Express = express();

app.use(express.json());
 
/**

* Retrieve a customer by ID.

* @route GET /api/customers/:id

* @param req - Express request object

* @param res - Express response object

*/

app.get("/api/customers/:id", (req: Request, res: Response): void => {

    const customerId: number = parseInt(req.params.id);

    const customer: Customer | undefined = customers.find(

        (c) => c.id === customerId

    );

    if (customer) {

        res.json(customer);

    } else {

        res.status(404).send("Customer not found");

    }

});
 
/**

* Record a purchase for a customer and update status based on points.

* Applies multipliers and handles PLATINUM and GOLD grace period.

* @route POST /api/customers/:id/purchase

* @param req - Express request object

* @param res - Express response object

*/

app.post("/api/customers/:id/purchase", (req: Request, res: Response): void => {

    const customerId: number = parseInt(req.params.id);

    const customer: Customer | undefined = customers.find(

        (c) => c.id === customerId

    );

    if (!customer) {

        res.status(404).send("Customer not found");

        return;

    }
 
    const purchaseAmount: number = req.body.amount;

    const storeLocation: string = req.body.storeLocation;
 
    // Define multipliers by status

    const multipliers: Record<Customer["status"], number> = {

        BRONZE: 1,

        SILVER: 1,

        GOLD: 1.2,

        PLATINUM: 2,

    };
 
    // Calculate earned points

    const basePoints = Math.floor(purchaseAmount / 10);

    const earnedPoints = Math.floor(basePoints * multipliers[customer.status]);

    customer.points += earnedPoints;

    customer.lastPurchaseDate = new Date().toISOString();
 
    const now = new Date();
 
    // Handle 30-day GOLD grace period

    if (customer.status === "GOLD" && customer.lastStatusChange) {

        const daysSinceChange =

            (now.getTime() - new Date(customer.lastStatusChange).getTime()) /

            (1000 * 60 * 60 * 24);
 
        if (daysSinceChange < 30 && customer.points < 750) {

            // Keep GOLD during grace period

            res.json(customer);
            return;


        }

    }
 
    // Evaluate new status thresholds

    let newStatus: Customer["status"] = "BRONZE";

    if (customer.points >= 1000) newStatus = "PLATINUM";

    else if (customer.points >= 750) newStatus = "GOLD";

    else if (customer.points >= 500) newStatus = "SILVER";
 
    // Update status if changed

    if (newStatus !== customer.status) {

        customer.status = newStatus;

        customer.lastStatusChange = now.toISOString();

    }
 
    res.json(customer);

});
 
/**

* Update customer preferences, such as notifications, preferred store, and email.

* @route PATCH /api/customers/:id/preferences

* @param req - Express request object

* @param res - Express response object

*/

app.patch(

    "/api/customers/:id/preferences",

    (req: Request, res: Response): void => {

        const customerId: number = parseInt(req.params.id);

        const customer: Customer | undefined = customers.find(

            (c) => c.id === customerId

        );

        if (!customer) {

            res.status(404).send("Customer not found");

            return;

        }
 
        if (typeof req.body.notifications === "boolean") {

            customer.notifications = req.body.notifications;

        }

        if (typeof req.body.preferredStore === "string") {

            customer.preferredStore = req.body.preferredStore;

        }

        if (typeof req.body.email === "string") {

            customer.email = req.body.email;

        }
 
        res.json(customer);

    }

);
 
export default app;

 