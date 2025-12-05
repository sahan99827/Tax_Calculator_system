const navLinks = document.querySelectorAll('.nav-link-custom');
        const contentArea = document.getElementById('contentArea');
        const formatter = new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'LKR', 
            minimumFractionDigits: 2 
        });

        // --- TAX SLABS (For other modules) ---
        const MONTHLY_TAX_SLABS = [
            { max: 100000, rate: 0.00 }, 
            { max: 141667, rate: 0.06 }, 
            { max: 183333, rate: 0.12 },
            { max: 225000, rate: 0.18 },
            { max: 266667, rate: 0.24 },
            { max: 308333, rate: 0.30 },
            { max: Infinity, rate: 0.36 } 
        ];

        const ANNUAL_TAX_SLABS = [
            { max: 1200000, rate: 0.00 }, 
            { max: 1700000, rate: 0.06 }, 
            { max: 2200000, rate: 0.12 },
            { max: 2700000, rate: 0.18 },
            { max: 3200000, rate: 0.24 },
            { max: 3700000, rate: 0.30 },
            { max: Infinity, rate: 0.36 } 
        ];

        // --- CORE CALCULATION LOGIC ---
        
        // --- 1. WITHHOLDING TAX CALCULATION ---
        function calculateWithholdingTax(type, amount) {
            let taxAmount = 0;
            let taxableAmount = 0;
            let taxRate = 0;
            let message = "";
            const THRESHOLD = 100000;

            switch (type) {
                case 'rent':
                    taxRate = 0.10; // 10%
                    if (amount > THRESHOLD) {
                        taxableAmount = amount - THRESHOLD;
                        taxAmount = taxableAmount * taxRate;
                        message = `10% Rent Tax applied to the amount above ${formatter.format(THRESHOLD)}.`;
                    } else {
                        taxableAmount = 0;
                        taxAmount = 0;
                        message = `No Rent Tax applied (amount is below ${formatter.format(THRESHOLD)} threshold).`;
                    }
                    break;
                case 'interest':
                    taxRate = 0.05; // 5%
                    taxableAmount = amount;
                    taxAmount = amount * taxRate;
                    message = `5% Bank Interest Tax applied to the full amount.`;
                    break;
                case 'dividend':
                    taxRate = 0.14; // 14%
                    if (amount > THRESHOLD) {
                        taxableAmount = amount - THRESHOLD;
                        taxAmount = taxableAmount * taxRate;
                        message = `14% Dividend Tax applied to the amount above ${formatter.format(THRESHOLD)}.`;
                    } else {
                        taxableAmount = 0;
                        taxAmount = 0;
                        message = `No Dividend Tax applied (amount is below ${formatter.format(THRESHOLD)} threshold).`;
                    }
                    break;
                default:
                    message = "Please select a valid tax type.";
            }

            return {
                taxAmount: taxAmount,
                taxableAmount: taxableAmount,
                rate: taxRate * 100 + "%",
                baseAmount: amount,
                taxType: type,
                message: message
            };
        }
        
        // --- 2. PAYABLE TAX CALCULATION (Monthly) ---
        function calculatePayableTax(salary) {
            // ... (Same logic as previous steps)
            let taxAmount = 0;
            let taxableIncome = salary;
            let previousMax = 0;
            let appliedRates = new Set();
            let taxBreakdown = [];

            if (taxableIncome <= MONTHLY_TAX_SLABS[0].max) {
                appliedRates.add("0%");
            }

            for (const slab of MONTHLY_TAX_SLABS) {
                const slabLimit = slab.max;
                const slabRate = slab.rate;
                const slabRatePercent = slabRate * 100 + "%";

                const incomeInSlab = Math.min(taxableIncome, slabLimit) - previousMax;

                if (incomeInSlab > 0) {
                    const taxInSlab = incomeInSlab * slabRate;
                    taxAmount += taxInSlab;
                    appliedRates.add(slabRatePercent);

                    if (slabRate > 0) {
                        taxBreakdown.push({
                            range: `${formatter.format(previousMax + 1)} - ${formatter.format(slabLimit)}`,
                            taxable: formatter.format(incomeInSlab),
                            rate: slabRatePercent,
                            tax: formatter.format(taxInSlab),
                        });
                    }
                }

                if (taxableIncome <= slabLimit) {
                    break;
                }

                previousMax = slabLimit;
            }

            const netSalary = salary - taxAmount;

            return {
                taxAmount: taxAmount,
                netSalary: netSalary,
                appliedRates: Array.from(appliedRates).join(", "),
                breakdown: taxBreakdown,
            };
        }

        // --- 3. INCOME TAX CALCULATION (Annual) ---
        function calculateAnnualTax(income) {
            // ... (Same logic as previous steps)
             let taxAmount = 0;
            let taxableIncome = income;
            let previousMax = 0;
            let appliedRates = new Set();
            let taxBreakdown = [];

            if (taxableIncome <= ANNUAL_TAX_SLABS[0].max) {
                appliedRates.add('0%');
            }

            for (const slab of ANNUAL_TAX_SLABS) {
                const slabLimit = slab.max;
                const slabRate = slab.rate;
                const slabRatePercent = (slabRate * 100) + '%';
                
                const incomeInSlab = Math.min(taxableIncome, slabLimit) - previousMax;

                if (incomeInSlab > 0) {
                    const taxInSlab = incomeInSlab * slabRate;
                    taxAmount += taxInSlab;
                    appliedRates.add(slabRatePercent);
                    
                    if (slabRate > 0) {
                        taxBreakdown.push({
                            range: `${formatter.format(previousMax + 1)} - ${formatter.format(slabLimit)}`,
                            taxable: formatter.format(incomeInSlab),
                            rate: slabRatePercent,
                            tax: formatter.format(taxInSlab)
                        });
                    }
                }
                
                if (taxableIncome <= slabLimit) {
                    break;
                }

                previousMax = slabLimit;
            }

            const netIncome = income - taxAmount;

            return {
                taxAmount: taxAmount,
                netIncome: netIncome,
                appliedRates: Array.from(appliedRates).join(', '),
                breakdown: taxBreakdown
            };
        }
        
        // --- 4. SSCL TAX CALCULATION ---
        function calculateSSCLTax(value) {
            // ... (Same logic as previous steps)
            const saleTaxRate = 0.025; // 2.5%
            const vatRate = 0.15;     // 15%

            const saleTax = value * saleTaxRate;
            const afterSaleTax = value + saleTax;
            const vat = afterSaleTax * vatRate;
            const sscl = saleTax + vat;

            return {
                saleTax: saleTax,
                afterSaleTax: afterSaleTax,
                vat: vat,
                sscl: sscl,
                baseValue: value
            };
        }
        
        // --- 5. LEASING CALCULATION (EMI) ---
        function calculateEMI(principal, annualRate, years) {
            // ... (Same logic as previous steps)
            if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;

            const monthlyRate = annualRate / 12 / 100; // i
            const numPayments = years * 12; // n

            if (monthlyRate === 0) {
                 return principal / numPayments;
            }

            const powerFactor = Math.pow(1 + monthlyRate, numPayments);
            const emi = (principal * monthlyRate * powerFactor) / (powerFactor - 1);
            
            return emi;
        }

        // --- 6. LEASING CALCULATION (Max Loan) ---
        function calculateMaxLoan(maxPayment, annualRate, years) {
            // ... (Same logic as previous steps)
            if (maxPayment <= 0 || annualRate <= 0 || years <= 0) return 0;
            
            const monthlyRate = annualRate / 12 / 100; // i
            const numPayments = years * 12; // n

            if (monthlyRate === 0) {
                 return maxPayment * numPayments;
            }

            const factor = (1 - (1 / Math.pow(1 + monthlyRate, numPayments))) / monthlyRate;
            const maxLoan = maxPayment * factor;
            
            return maxLoan;
        }


        // --- HTML TEMPLATES ---

        const getWithholdingHTML = () => `
            <h2><i class="fas fa-hand-holding-usd me-2"></i> Withholding Tax</h2>
            <p class="text-muted">Calculate tax withheld for Rent, Bank Interest, and Dividends based on statutory rates and thresholds.</p>
            
            <form id="withholdingTaxForm">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="taxType" class="form-label">Select Tax Type</label>
                        <select class="form-select" id="taxType" name="taxType" required>
                            <option value="" disabled selected>Choose a tax option...</option>
                            <option value="rent">Rent Tax (10% over Rs. 100,000)</option>
                            <option value="interest">Bank Interest Tax (5% of full amount)</option>
                            <option value="dividend">Dividend Tax (14% over Rs. 100,000)</option>
                        </select>
                        <div class="invalid-feedback">Please select a tax type.</div>
                    </div>
                    <div class="col-md-6">
                        <label for="amount" class="form-label">Income/Value Amount (Rs.)</label>
                        <input type="number" class="form-control" id="amount" name="amount" placeholder="Enter income or value amount" min="1" required>
                        <div class="invalid-feedback" id="amountFeedback">Please enter a valid amount (must be a number > 0).</div>
                    </div>
                </div>
                <div class="mt-4">
                    <button type="submit" class="btn btn-success"><i class="fas fa-check-circle me-2"></i> Calculate Withholding</button>
                    <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset Form</button>
                </div>
            </form>

            <div id="results" class="mt-4" style="display:none;">
                <div class="result-card withholding p-3">
                    <h5 class="card-title mb-1" id="taxResultTitle">Calculated Tax</h5>
                    <div class="result-value" id="taxAmountResult"></div>
                </div>
                
                <h5 class="mt-4 text-primary">Calculation Details</h5>
                <p id="calculationMessage" class="text-success fw-bold"></p>
                
                <table class="table table-striped table-bordered mt-3">
                    <thead class="table-dark">
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                            <th>Tax Rule Applied</th>
                        </tr>
                    </thead>
                    <tbody id="taxBreakdownTableBody">
                    </tbody>
                </table>
            </div>
        `;
        
        const getPayableTaxHTML = () => `
            <h2><i class="fas fa-calculator me-2"></i> Payable Tax (Monthly Salary)</h2>
            <p class="text-muted">Calculate progressive monthly tax, net salary, and view the tax rate breakdown.</p>
            
            <form id="payableTaxForm">
                <div class="mb-3">
                    <label for="monthlySalary" class="form-label">Monthly Salary (Rs.)</label>
                    <input type="number" class="form-control" id="monthlySalary" name="monthlySalary" placeholder="Enter gross monthly salary" min="1" required>
                    <div class="invalid-feedback" id="salaryFeedback">Please enter a valid salary amount (must be a number > 0).</div>
                </div>
                <button type="submit" class="btn btn-success"><i class="fas fa-check-circle me-2"></i> Calculate Tax</button>
                <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset Form</button>
            </form>

            <div id="results" class="mt-4" style="display:none;">
                <h4 class="text-primary mt-4">Calculation Results</h4>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Tax Amount</h5>
                            <div class="result-value" id="taxAmountResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Net Salary</h5>
                            <div class="result-value" id="netSalaryResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Applied Rate(s)</h5>
                            <div class="result-value" id="appliedRatesResult" style="font-size: 1rem;"></div>
                        </div>
                    </div>
                </div>

                <h5 class="mt-4">Tax Calculation Breakdown</h5>
                <table class="table table-striped table-bordered mt-3">
                    <thead class="table-dark">
                        <tr>
                            <th>Salary Range (Rs.)</th>
                            <th>Taxable Amount (Rs.)</th>
                            <th>Rate</th>
                            <th>Tax in Slab (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody id="taxBreakdownTableBody">
                    </tbody>
                </table>
            </div>
        `;

        const getIncomeTaxHTML = () => `
            <h2><i class="fas fa-calendar-alt me-2"></i> Income Tax (Annual)</h2>
            <p class="text-muted">Calculate progressive annual tax based on the statutory annual income slabs.</p>
            
            <form id="incomeTaxForm">
                <div class="mb-3">
                    <label for="annualIncome" class="form-label">Annual Income (Rs.)</label>
                    <input type="number" class="form-control" id="annualIncome" name="annualIncome" placeholder="Enter gross annual income" min="1" required>
                    <div class="invalid-feedback" id="incomeFeedback">Please enter a valid annual income amount (must be a number > 0).</div>
                </div>
                <button type="submit" class="btn btn-success"><i class="fas fa-check-circle me-2"></i> Calculate Tax</button>
                <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset Form</button>
            </form>

            <div id="results" class="mt-4" style="display:none;">
                <h4 class="text-primary mt-4">Calculation Results</h4>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Tax Amount</h5>
                            <div class="result-value" id="taxAmountResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Net Income After Tax</h5>
                            <div class="result-value" id="netIncomeResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Applied Rate(s)</h5>
                            <div class="result-value" id="appliedRatesResult" style="font-size: 1rem;"></div>
                        </div>
                    </div>
                </div>

                <h5 class="mt-4">Tax Calculation Breakdown</h5>
                <table class="table table-striped table-bordered mt-3">
                    <thead class="table-dark">
                        <tr>
                            <th>Salary Range (Rs.)</th>
                            <th>Taxable Amount (Rs.)</th>
                            <th>Rate</th>
                            <th>Tax in Slab (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody id="taxBreakdownTableBody">
                    </tbody>
                </table>
            </div>
        `;
        
        const getSSCLTaxHTML = () => `
            <h2><i class="fas fa-file-invoice-dollar me-2"></i> SSCL Tax (Sales and VAT)</h2>
            <p class="text-muted">Calculate <b>Sale Tax (2.5%)</b> and <b>VAT (15%)</b> applied after adding the sale tax.</p>
            
            <form id="ssclTaxForm">
                <div class="mb-3">
                    <label for="baseValue" class="form-label">Base Value/Cost (Rs.)</label>
                    <input type="number" class="form-control" id="baseValue" name="baseValue" placeholder="Enter base value of sale/service" min="1" required>
                    <div class="invalid-feedback" id="valueFeedback">Please enter a valid base value (must be a number > 0).</div>
                </div>
                <button type="submit" class="btn btn-success"><i class="fas fa-check-circle me-2"></i> Calculate SSCL</button>
                <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset Form</button>
            </form>

            <div id="results" class="mt-4" style="display:none;">
                <h4 class="text-primary mt-4">Calculation Results</h4>
                <div class="row g-3">
                    <div class="col-md-6 col-lg-3">
                        <div class="result-card">
                            <h5 class="card-title">Sale Tax (2.5%)</h5>
                            <div class="result-value" id="saleTaxResult"></div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="result-card">
                            <h5 class="card-title">After-Sale Tax Amount</h5>
                            <div class="result-value" id="afterSaleTaxResult"></div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="result-card">
                            <h5 class="card-title">VAT (15%)</h5>
                            <div class="result-value" id="vatResult"></div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="result-card bg-primary text-white">
                            <h5 class="card-title">Final SSCL Value</h5>
                            <div class="result-value text-white" id="ssclResult"></div>
                        </div>
                    </div>
                </div>
                
                <h5 class="mt-4">Calculation Breakdown</h5>
                <table class="table table-striped table-bordered mt-3">
                    <thead class="table-dark">
                        <tr>
                            <th>Step</th>
                            <th>Formula</th>
                            <th>Result (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody id="taxBreakdownTableBody">
                    </tbody>
                </table>
            </div>
        `;
        
        const getLeasingHTML = () => `
            <h2 class="mb-4"><i class="fas fa-car me-2"></i> Leasing Calculations</h2>
            <p class="text-muted">Calculate Monthly Installments (EMI) and determine the Maximum Loan Value based on your affordability.</p>
            
            <div class="row">
                <div class="col-lg-6 mb-5">
                    <div class="card shadow-sm border-0 h-100 p-3">
                        <div class="card-body">
                            <h4 class="card-title text-success"><i class="fas fa-hand-holding-usd me-2"></i> Monthly EMI & Plan Comparison</h4>
                            <form id="emiForm">
                                <div class="mb-3">
                                    <label for="loanAmount" class="form-label">Loan Amount (Rs.)</label>
                                    <input type="number" class="form-control" id="loanAmount" name="loanAmount" placeholder="Enter desired loan amount" min="1" required>
                                    <div class="invalid-feedback" id="loanFeedback">Please enter a valid loan amount (must be a number > 0).</div>
                                </div>
                                <div class="mb-3">
                                    <label for="annualInterestRate" class="form-label">Annual Interest Rate (%)</label>
                                    <input type="number" class="form-control" id="annualInterestRate" name="annualInterestRate" placeholder="Enter annual interest rate (e.g., 10)" min="0.01" step="0.01" required>
                                    <div class="invalid-feedback" id="rateFeedback">Please enter a valid interest rate (must be a number > 0).</div>
                                </div>
                                <button type="submit" class="btn btn-success"><i class="fas fa-check-circle me-2"></i> Calculate EMI</button>
                                <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-5">
                    <div class="card shadow-sm border-0 h-100 p-3">
                        <div class="card-body">
                            <h4 class="card-title text-info"><i class="fas fa-dollar-sign me-2"></i> Max Loan Value (Reverse)</h4>
                            <form id="reverseForm">
                                <div class="mb-3">
                                    <label for="maxMonthlyPayment" class="form-label">Max Monthly Payment (Rs.)</label>
                                    <input type="number" class="form-control" id="maxMonthlyPayment" name="maxMonthlyPayment" placeholder="Enter maximum affordable payment" min="1" required>
                                    <div class="invalid-feedback" id="paymentFeedback">Please enter a valid payment amount (must be a number > 0).</div>
                                </div>
                                <div class="mb-3">
                                    <label for="reverseAnnualInterestRate" class="form-label">Annual Interest Rate (%)</label>
                                    <input type="number" class="form-control" id="reverseAnnualInterestRate" name="reverseAnnualInterestRate" placeholder="Enter annual interest rate (e.g., 10)" min="0.01" step="0.01" required>
                                    <div class="invalid-feedback" id="reverseRateFeedback">Please enter a valid interest rate (must be a number > 0).</div>
                                </div>
                                <button type="submit" class="btn btn-info text-white"><i class="fas fa-car me-2"></i> Calculate Max Loan</button>
                                <button type="reset" class="btn btn-outline-secondary ms-2"><i class="fas fa-redo me-2"></i> Reset</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div id="emiResults" class="mt-4" style="display:none;">
                <h4 class="text-primary mt-4">Monthly Installment Comparison</h4>
                <div class="row g-3" id="planComparisonContainer">
                    </div>
                
                <h5 class="mt-4">EMI Calculation Breakdown (3 Year Plan)</h5>
                <table class="table table-striped table-bordered mt-3">
                    <thead class="table-dark">
                        <tr>
                            <th>Variable</th>
                            <th>Value</th>
                            <th>Formula Step</th>
                        </tr>
                    </thead>
                    <tbody id="emiBreakdownTableBody">
                        </tbody>
                </table>
            </div>
            
            <div id="reverseResults" class="mt-4" style="display:none;">
                <h4 class="text-info mt-4">Max Loan Value Results</h4>
                <div class="row g-3" id="maxLoanComparisonContainer">
                    </div>
            </div>
        `;


        
        const contentData = {
            withholding: getWithholdingHTML,
            payable: getPayableTaxHTML,
            income: getIncomeTaxHTML,
            sscl: getSSCLTaxHTML, 
            leasing: getLeasingHTML, 
        };


        // --- LISTENER ATTACHMENT FUNCTIONS ---

        function attachWithholdingListeners() {
            const form = document.getElementById('withholdingTaxForm');
            const taxTypeInput = document.getElementById('taxType');
            const amountInput = document.getElementById('amount');
            const resultsDiv = document.getElementById('results');
            const amountFeedback = document.getElementById('amountFeedback');
            const taxAmountResult = document.getElementById('taxAmountResult');
            const taxResultTitle = document.getElementById('taxResultTitle');
            const breakdownBody = document.getElementById('taxBreakdownTableBody');
            const calculationMessage = document.getElementById('calculationMessage');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const taxType = taxTypeInput.value;
                const amount = parseFloat(amountInput.value);

                // Validation
                let isValid = true;
                amountInput.classList.remove('is-invalid');
                taxTypeInput.classList.remove('is-invalid');

                if (!taxType) {
                    taxTypeInput.classList.add('is-invalid');
                    isValid = false;
                }
                if (isNaN(amount) || amount <= 0) {
                    amountInput.classList.add('is-invalid');
                    amountFeedback.textContent = 'Please enter a valid amount (must be a number > 0).';
                    isValid = false;
                } else {
                    amountFeedback.textContent = '';
                }

                if (!isValid) {
                    resultsDiv.style.display = 'none';
                    return;
                }

                const result = calculateWithholdingTax(taxType, amount);

                // Display results
                taxAmountResult.textContent = formatter.format(result.taxAmount);
                taxResultTitle.textContent = `Calculated Tax (${result.rate} Applied)`;
                calculationMessage.textContent = result.message;
                
                // Determine base value for breakdown
                let baseDescription = "";
                let taxRule = "";
                
                if (taxType === 'rent') {
                    baseDescription = `Amount Above Rs. ${formatter.format(100000)}`;
                    taxRule = `10% of Taxable Amount`;
                } else if (taxType === 'interest') {
                    baseDescription = 'Full Amount';
                    taxRule = `5% of Full Amount`;
                } else if (taxType === 'dividend') {
                    baseDescription = `Amount Above Rs. ${formatter.format(100000)}`;
                    taxRule = `14% of Taxable Amount`;
                }

                // Display breakdown
                breakdownBody.innerHTML = `
                    <tr>
                        <td>Total Income/Value</td>
                        <td>${formatter.format(result.baseAmount)}</td>
                        <td>Input Value</td>
                    </tr>
                    <tr>
                        <td>Taxable Base (${baseDescription})</td>
                        <td>${formatter.format(result.taxableAmount)}</td>
                        <td>${result.taxableAmount === result.baseAmount ? 'Full Amount' : `Income/Value - ${formatter.format(100000)} Threshold`}</td>
                    </tr>
                    <tr class="table-info">
                        <td>Tax Amount (${result.rate})</td>
                        <td>${formatter.format(result.taxAmount)}</td>
                        <td>${taxRule}</td>
                    </tr>
                `;

                resultsDiv.style.display = 'block';
            });

            form.addEventListener('reset', function() {
                amountInput.classList.remove('is-invalid');
                taxTypeInput.classList.remove('is-invalid');
                resultsDiv.style.display = 'none';
                amountFeedback.textContent = 'Please enter a valid amount (must be a number > 0).';
            });
        }
        
        function attachPayableTaxListeners() {
            const form = document.getElementById("payableTaxForm");
            const salaryInput = document.getElementById("monthlySalary");
            const resultsDiv = document.getElementById("results");
            const feedbackDiv = document.getElementById("salaryFeedback");
            const breakdownBody = document.getElementById("taxBreakdownTableBody");

            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const salary = parseFloat(salaryInput.value);

                if (isNaN(salary) || salary <= 0) {
                    salaryInput.classList.add("is-invalid");
                    feedbackDiv.textContent = "Please enter a valid salary amount (must be a number > 0).";
                    resultsDiv.style.display = "none";
                    return;
                } else {
                    salaryInput.classList.remove("is-invalid");
                    feedbackDiv.textContent = "";
                }

                const result = calculatePayableTax(salary);

                document.getElementById("taxAmountResult").textContent = formatter.format(result.taxAmount);
                document.getElementById("netSalaryResult").textContent = formatter.format(result.netSalary);
                document.getElementById("appliedRatesResult").textContent = result.appliedRates;

                breakdownBody.innerHTML = "";
                if (result.breakdown.length > 0) {
                    result.breakdown.forEach((row) => {
                        breakdownBody.innerHTML += `
                            <tr>
                                <td>${row.range}</td>
                                <td>${row.taxable}</td>
                                <td>${row.rate}</td>
                                <td>${row.tax}</td>
                            </tr>
                        `;
                    });
                } else {
                    breakdownBody.innerHTML = `<tr><td colspan="4" class="text-center">No tax applied (below Rs. ${MONTHLY_TAX_SLABS[0].max} threshold).</td></tr>`;
                }

                resultsDiv.style.display = "block";
            });

            form.addEventListener("reset", function () {
                salaryInput.classList.remove("is-invalid");
                resultsDiv.style.display = "none";
                feedbackDiv.textContent = "Please enter a valid salary amount (must be a number > 0).";
            });
        }


        function attachIncomeTaxListeners() {
            const form = document.getElementById('incomeTaxForm');
            const incomeInput = document.getElementById('annualIncome');
            const resultsDiv = document.getElementById('results');
            const feedbackDiv = document.getElementById('incomeFeedback');
            const breakdownBody = document.getElementById('taxBreakdownTableBody');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const income = parseFloat(incomeInput.value);
                
                if (isNaN(income) || income <= 0) {
                    incomeInput.classList.add('is-invalid');
                    feedbackDiv.textContent = 'Please enter a valid annual income amount (must be a number > 0).';
                    resultsDiv.style.display = 'none';
                    return;
                } else {
                    incomeInput.classList.remove('is-invalid');
                    feedbackDiv.textContent = '';
                }

                const result = calculateAnnualTax(income);
                
                document.getElementById('taxAmountResult').textContent = formatter.format(result.taxAmount);
                document.getElementById('netIncomeResult').textContent = formatter.format(result.netIncome);
                document.getElementById('appliedRatesResult').textContent = result.appliedRates;
                
                breakdownBody.innerHTML = '';
                if (result.breakdown.length > 0) {
                    result.breakdown.forEach(row => {
                        breakdownBody.innerHTML += `
                            <tr>
                                <td>${row.range}</td>
                                <td>${row.taxable}</td>
                                <td>${row.rate}</td>
                                <td>${row.tax}</td>
                            </tr>
                        `;
                    });
                } else {
                     breakdownBody.innerHTML = `<tr><td colspan="4" class="text-center">No tax applied (below Rs. ${ANNUAL_TAX_SLABS[0].max} threshold).</td></tr>`;
                }

                resultsDiv.style.display = 'block';
            });
            
            form.addEventListener('reset', function() {
                 incomeInput.classList.remove('is-invalid');
                 resultsDiv.style.display = 'none';
                 feedbackDiv.textContent = 'Please enter a valid annual income amount (must be a number > 0).';
            });
        }

        function attachSSCLTaxListeners() {
            const form = document.getElementById('ssclTaxForm');
            const valueInput = document.getElementById('baseValue');
            const resultsDiv = document.getElementById('results');
            const feedbackDiv = document.getElementById('valueFeedback');
            const breakdownBody = document.getElementById('taxBreakdownTableBody');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(valueInput.value);
                
                if (isNaN(value) || value <= 0) {
                    valueInput.classList.add('is-invalid');
                    feedbackDiv.textContent = 'Please enter a valid base value (must be a number > 0).';
                    resultsDiv.style.display = 'none';
                    return;
                } else {
                    valueInput.classList.remove('is-invalid');
                    feedbackDiv.textContent = '';
                }

                const result = calculateSSCLTax(value);
                
                document.getElementById('saleTaxResult').textContent = formatter.format(result.saleTax);
                document.getElementById('afterSaleTaxResult').textContent = formatter.format(result.afterSaleTax);
                document.getElementById('vatResult').textContent = formatter.format(result.vat);
                document.getElementById('ssclResult').textContent = formatter.format(result.sscl);
                
                breakdownBody.innerHTML = `
                    <tr>
                        <td>1. Sale Tax (**2.5%** of Base Value)</td>
                        <td>${formatter.format(result.baseValue)} × 0.025</td>
                        <td>${formatter.format(result.saleTax)}</td>
                    </tr>
                    <tr>
                        <td>2. After-Sale Tax Amount</td>
                        <td>Base Value + Sale Tax</td>
                        <td>${formatter.format(result.afterSaleTax)}</td>
                    </tr>
                    <tr>
                        <td>3. VAT (**15%** of After-Sale Tax Amount)</td>
                        <td>${formatter.format(result.afterSaleTax)} × 0.15</td>
                        <td>${formatter.format(result.vat)}</td>
                    </tr>
                    <tr class="table-info">
                        <td>4. **Final SSCL Value**</td>
                        <td>Sale Tax + VAT</td>
                        <td>**${formatter.format(result.sscl)}**</td>
                    </tr>
                `;

                resultsDiv.style.display = 'block';
            });
            
            form.addEventListener('reset', function() {
                 valueInput.classList.remove('is-invalid');
                 resultsDiv.style.display = 'none';
                 feedbackDiv.textContent = 'Please enter a valid base value (must be a number > 0).';
            });
        }
        
        function attachLeasingListeners() {
            const emiForm = document.getElementById('emiForm');
            const reverseForm = document.getElementById('reverseForm');
            const emiResultsDiv = document.getElementById('emiResults');
            const reverseResultsDiv = document.getElementById('reverseResults');
            const emiBreakdownBody = document.getElementById('emiBreakdownTableBody');
            const planComparisonContainer = document.getElementById('planComparisonContainer');
            const maxLoanComparisonContainer = document.getElementById('maxLoanComparisonContainer');


            // --- EMI CALCULATION LISTENER ---
            emiForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const loanInput = document.getElementById('loanAmount');
                const rateInput = document.getElementById('annualInterestRate');
                const loanFeedback = document.getElementById('loanFeedback');
                const rateFeedback = document.getElementById('rateFeedback');

                const loanAmount = parseFloat(loanInput.value);
                const annualRate = parseFloat(rateInput.value);

                loanInput.classList.remove('is-invalid');
                rateInput.classList.remove('is-invalid');
                loanFeedback.textContent = 'Please enter a valid loan amount (must be a number > 0).';
                rateFeedback.textContent = 'Please enter a valid interest rate (must be a number > 0).';

                let isValid = true;
                if (isNaN(loanAmount) || loanAmount <= 0) {
                    loanInput.classList.add('is-invalid');
                    isValid = false;
                }
                if (isNaN(annualRate) || annualRate <= 0) {
                    rateInput.classList.add('is-invalid');
                    isValid = false;
                }

                if (!isValid) {
                    emiResultsDiv.style.display = 'none';
                    return;
                }

                const comparisonYears = [3, 4, 5];
                let comparisonHTML = '';
                let breakdown = {};
                
                comparisonYears.forEach(years => {
                    const emi = calculateEMI(loanAmount, annualRate, years);
                    const totalPayments = years * 12;
                    const totalInterest = (emi * totalPayments) - loanAmount;

                    comparisonHTML += `
                        <div class="col-md-4">
                            <div class="result-card ${years === 3 ? 'bg-primary text-white' : ''}">
                                <h5 class="card-title ${years === 3 ? 'text-white' : ''}">${years} Year Plan</h5>
                                <div class="result-value ${years === 3 ? 'text-white' : ''}">${formatter.format(emi)}</div>
                                <p class="text-muted mb-0 ${years === 3 ? 'text-white' : ''}"><small>Total Interest: ${formatter.format(totalInterest)}</small></p>
                            </div>
                        </div>
                    `;
                    
                    if (years === 3) {
                        const monthlyRate = annualRate / 12 / 100;
                        const numPayments = years * 12;
                        breakdown = { emi, loanAmount, annualRate, years, monthlyRate, numPayments };
                    }
                });

                planComparisonContainer.innerHTML = comparisonHTML;
                
                emiBreakdownBody.innerHTML = `
                    <tr>
                        <td>Loan Principal (A)</td>
                        <td>${formatter.format(breakdown.loanAmount)}</td>
                        <td>Input Value</td>
                    </tr>
                    <tr>
                        <td>Annual Rate</td>
                        <td>${breakdown.annualRate}%</td>
                        <td>Input Value</td>
                    </tr>
                    <tr>
                        <td>Monthly Rate (i)</td>
                        <td>${breakdown.monthlyRate.toFixed(6)}</td>
                        <td>Annual Rate / 12 / 100</td>
                    </tr>
                    <tr>
                        <td>No. of Payments (n)</td>
                        <td>${breakdown.numPayments}</td>
                        <td>Years (${breakdown.years}) × 12</td>
                    </tr>
                    <tr class="table-success">
                        <td>**Monthly EMI**</td>
                        <td>**${formatter.format(breakdown.emi)}**</td>
                        <td>(A * i * (1+i)^n) / ((1+i)^n - 1)</td>
                    </tr>
                `;

                emiResultsDiv.style.display = 'block';
                reverseResultsDiv.style.display = 'none';
            });

            emiForm.addEventListener('reset', function() {
                document.getElementById('loanAmount').classList.remove('is-invalid');
                document.getElementById('annualInterestRate').classList.remove('is-invalid');
                emiResultsDiv.style.display = 'none';
            });
            
            
            // --- REVERSE CALCULATION LISTENER (Max Loan) ---
            reverseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const paymentInput = document.getElementById('maxMonthlyPayment');
                const rateInput = document.getElementById('reverseAnnualInterestRate');
                const paymentFeedback = document.getElementById('paymentFeedback');
                const rateFeedback = document.getElementById('reverseRateFeedback');

                const maxMonthlyPayment = parseFloat(paymentInput.value);
                const annualRate = parseFloat(rateInput.value);

                paymentInput.classList.remove('is-invalid');
                rateInput.classList.remove('is-invalid');
                paymentFeedback.textContent = 'Please enter a valid payment amount (must be a number > 0).';
                rateFeedback.textContent = 'Please enter a valid interest rate (must be a number > 0).';

                let isValid = true;
                if (isNaN(maxMonthlyPayment) || maxMonthlyPayment <= 0) {
                    paymentInput.classList.add('is-invalid');
                    isValid = false;
                }
                if (isNaN(annualRate) || annualRate <= 0) {
                    rateInput.classList.add('is-invalid');
                    isValid = false;
                }

                if (!isValid) {
                    reverseResultsDiv.style.display = 'none';
                    return;
                }

                const comparisonYears = [3, 4, 5];
                let comparisonHTML = '';

                comparisonYears.forEach(years => {
                    const maxLoan = calculateMaxLoan(maxMonthlyPayment, annualRate, years);

                    comparisonHTML += `
                        <div class="col-md-4">
                            <div class="result-card bg-info text-white">
                                <h5 class="card-title text-white">${years} Year Term</h5>
                                <div class="result-value text-white">${formatter.format(maxLoan)}</div>
                                <p class="text-white mb-0"><small>Max Principal Amount</small></p>
                            </div>
                        </div>
                    `;
                });

                maxLoanComparisonContainer.innerHTML = comparisonHTML;

                reverseResultsDiv.style.display = 'block';
                emiResultsDiv.style.display = 'none';
            });

            reverseForm.addEventListener('reset', function() {
                document.getElementById('maxMonthlyPayment').classList.remove('is-invalid');
                document.getElementById('reverseAnnualInterestRate').classList.remove('is-invalid');
                reverseResultsDiv.style.display = 'none';
            });
        }


        // --- RENDER CONTENT CORE LOGIC ---

        const renderContent = (section) => {
            const contentFn = contentData[section]; 
            contentArea.innerHTML = contentFn ? contentFn() : '<h2>Module Not Found</h2><p>Please select a module from the navigation bar.</p>';

            if (section === "withholding") {
                attachWithholdingListeners();
            } else if (section === "payable") {
                attachPayableTaxListeners();
            } else if (section === "income") { 
                attachIncomeTaxListeners();
            } else if (section === "sscl") { 
                attachSSCLTaxListeners();
            } else if (section === "leasing") { 
                attachLeasingListeners();
            }
        };


        // --- NAVIGATION AND INITIAL LOAD LOGIC ---

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                
                navLinks.forEach(l => l.classList.remove('active'));

                if (section === 'clear') {
                    const activeLink = document.querySelector('.nav-link-custom[data-section].active');
                    if (activeLink) {
                         const activeSection = activeLink.getAttribute('data-section');
                         
                         let resetSuccess = false;
                         let resetText = "";
                         
                         if (activeSection === 'withholding') {
                            document.getElementById('withholdingTaxForm')?.reset();
                            resetSuccess = true;
                            resetText = "The Withholding Tax form has been reset.";
                         } else if (activeSection === 'income') {
                            document.getElementById('incomeTaxForm')?.reset();
                            resetSuccess = true;
                            resetText = "The Annual Income Tax form has been reset.";
                         } else if (activeSection === 'payable') {
                            document.getElementById('payableTaxForm')?.reset();
                            resetSuccess = true;
                            resetText = "The Payable Tax form has been reset.";
                         } else if (activeSection === 'sscl') { 
                            document.getElementById('ssclTaxForm')?.reset();
                            resetSuccess = true;
                            resetText = "The SSCL Tax form has been reset.";
                         } else if (activeSection === 'leasing') {
                            document.getElementById('emiForm')?.reset();
                            document.getElementById('reverseForm')?.reset();
                            resetSuccess = true;
                            resetText = "The Leasing Calculation forms have been reset.";
                         }

                         if (resetSuccess) {
                            Swal.fire({
                                title: "Cleared!",
                                text: resetText,
                                icon: "success",
                                showConfirmButton: false,
                                timer: 1500,
                                draggable: true,
                            });
                         } else {
                             Swal.fire({
                                title: "Reset Not Applicable",
                                text: `Reset functionality for the '${activeSection}' module is not yet implemented or the form is already clear.`,
                                icon: "info",
                                showConfirmButton: false,
                                timer: 2000,
                                draggable: true,
                             });
                         }
                         return;
                    } 
                    
                    Swal.fire({
                        title: "Clear / Reset",
                        text: "No calculation form is currently active or loaded.",
                        icon: "warning",
                        showConfirmButton: false,
                        timer: 2000,
                        draggable: true,
                    });
                    return;
                }

                this.classList.add('active');
                renderContent(section);
                window.scrollTo(0, 0); 
            });
        });

        // Initial load: render the Withholding Tax module
        window.addEventListener('load', () => {
            renderContent('withholding'); 
            // Ensure the correct link is active on initial load
            document.querySelector('.nav-link-custom[data-section="withholding"]').classList.add('active');
        });