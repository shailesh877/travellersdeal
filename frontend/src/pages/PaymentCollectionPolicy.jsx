import React from 'react';

const PaymentCollectionPolicy = () => {
    return (
        <div className="container mx-auto px-4 py-8 pt-24 md:pt-28 max-w-4xl">
            <div className="bg-white shadow-md rounded-lg p-6 md:p-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Payment Collection Policy</h1>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Payment Collection</h2>
                    <p className="mb-4 text-gray-600">
                        The Supplier instructs Travellers Deal, acting as the Supplier’s commercial agent, to collect payments from Customers in the name and on behalf of the Supplier. The Supplier agrees that Travellers Deal may, from time to time and in its sole discretion, appoint sub-commercial agents to receive payments directly from Customers and to make onward payment of such successfully received sums to the Supplier.
                    </p>
                    <p className="mb-4 text-gray-600">
                        For payments made by Customers located in the United States, the Supplier appoints Travellers Deal’s designated operations entity as its limited payment agent solely for the purpose of directly accepting such payments on behalf of the Supplier and making onward payment of those sums to Travellers Deal or the Supplier, as applicable.
                    </p>
                    <p className="mb-4 text-gray-600">
                        The Supplier agrees that receipt of payment of the amount due from a Customer by Travellers Deal or any of its sub-commercial agents shall fully extinguish the Customer’s payment obligation to the Supplier. Any payment made by a Customer to Travellers Deal or its sub-commercial agents through the Travellers Deal platform shall be deemed equivalent to a payment made directly to the Supplier.
                    </p>
                    <p className="mb-4 text-gray-600">
                        Accordingly, the Supplier agrees to provide the Services to Customers in the agreed-upon manner as if the Supplier had received the Customer’s funds directly. The Supplier acknowledges and agrees that it shall have no recourse against a Customer once the funds have been tendered to Travellers Deal or any of its sub-commercial agents.
                    </p>
                    <p className="text-gray-600">
                        Travellers Deal uses third-party payment service providers to process payments from Customers and may appoint distribution partners or affiliated entities to act as sub-commercial agents for the purpose of collecting such payments. Travellers Deal shall bear credit card and banking fees associated with the receipt of payments from Customers; however, Travellers Deal may charge Customers applicable foreign exchange fees where relevant.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PaymentCollectionPolicy;
