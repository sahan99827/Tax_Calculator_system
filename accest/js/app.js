const navLinks = document.querySelectorAll('.nav-link-custom');
        const contentArea = document.getElementById('contentArea');
        const formatter = new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'LKR', 
            minimumFractionDigits: 2 
        });

        // --- TAX SLABS ---

        // Monthly Tax Slabs (Used for Payable Tax Module)
        const MONTHLY_TAX_SLABS = [
            { max: 100000, rate: 0.00 }, 
            { max: 141667, rate: 0.06 }, 
            { max: 183333, rate: 0.12 },
            { max: 225000, rate: 0.18 },
            { max: 266667, rate: 0.24 },
            { max: 308333, rate: 0.30 },
            { max: Infinity, rate: 0.36 } 
        ];

        // Annual Tax Slabs (Used for Income Tax Module)
        const ANNUAL_TAX_SLABS = [
            { max: 1200000, rate: 0.00 }, 
            { max: 1700000, rate: 0.06 }, 
            { max: 2200000, rate: 0.12 },
            { max: 2700000, rate: 0.18 },
            { max: 3200000, rate: 0.24 },
            { max: 3700000, rate: 0.30 },
            { max: Infinity, rate: 0.36 } 
        ];

        // --- CALCULATION LOGIC ---

        function calculatePayableTax(salary) {
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

        function calculateAnnualTax(income) {
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
                
                // Income within this slab
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
        
        function calculateSSCLTax(value) {
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


        // --- HTML TEMPLATES ---

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
        
        const contentData = {
            payable: getPayableTaxHTML,
            income: getIncomeTaxHTML,
            sscl: getSSCLTaxHTML, 
            withholding: () => `<h2><i class="fas fa-hand-holding-usd me-2"></i> Withholding Tax</h2><p>This module handles Rent Tax, Bank Interest Tax, and Dividend Tax calculations. (Implementation required)</p>`,
            leasing: () => `<h2><i class="fas fa-car me-2"></i> Leasing Calculations</h2><p>This module calculates Monthly Installments and Max Loan Value using the EMI formula. (Implementation required)</p>`,
        };


        // --- LISTENER ATTACHMENT FUNCTIONS ---

        function attachPayableTaxListeners() {
            const form = document.getElementById("payableTaxForm");
            const salaryInput = document.getElementById("monthlySalary");
            const resultsDiv = document.getElementById("results");
            const feedbackDiv = document.getElementById("salaryFeedback");
            const breakdownBody = document.getElementById("taxBreakdownTableBody");

            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const salary = parseFloat(salaryInput.value);

                // Validation check
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

                // Display results
                document.getElementById("taxAmountResult").textContent = formatter.format(result.taxAmount);
                document.getElementById("netSalaryResult").textContent = formatter.format(result.netSalary);
                document.getElementById("appliedRatesResult").textContent = result.appliedRates;

                // Display breakdown
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
                
                // Validation check
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
                
                // Display results
                document.getElementById('taxAmountResult').textContent = formatter.format(result.taxAmount);
                document.getElementById('netIncomeResult').textContent = formatter.format(result.netIncome);
                document.getElementById('appliedRatesResult').textContent = result.appliedRates;
                
                // Display breakdown
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
                
                // Validation check
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
                
                // Display results
                document.getElementById('saleTaxResult').textContent = formatter.format(result.saleTax);
                document.getElementById('afterSaleTaxResult').textContent = formatter.format(result.afterSaleTax);
                document.getElementById('vatResult').textContent = formatter.format(result.vat);
                document.getElementById('ssclResult').textContent = formatter.format(result.sscl);
                
                // Display breakdown
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


        // --- RENDER CONTENT CORE LOGIC ---

        const renderContent = (section) => {
            const contentFn = contentData[section]; 
            contentArea.innerHTML = contentFn ? contentFn() : '<h2>Module Not Found</h2><p>Please select a module from the navigation bar.</p>';

            if (section === "payable") {
                attachPayableTaxListeners();
            } else if (section === "income") { 
                attachIncomeTaxListeners();
            } else if (section === "sscl") { // Added SSCL listener attachment
                attachSSCLTaxListeners();
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
                         
                         if (activeSection === 'income') {
                            document.getElementById('incomeTaxForm').reset();
                            resetSuccess = true;
                            resetText = "The Annual Income Tax form has been reset.";
                         } else if (activeSection === 'payable') {
                            document.getElementById('payableTaxForm').reset();
                            resetSuccess = true;
                            resetText = "The Payable Tax form has been reset.";
                         } else if (activeSection === 'sscl') { // Added SSCL form reset
                            document.getElementById('ssclTaxForm').reset();
                            resetSuccess = true;
                            resetText = "The SSCL Tax form has been reset.";
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
                                text: `Reset functionality for the '${activeSection}' module is not yet implemented.`,
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

        // Initial load: render the Income Tax module (or change this to 'sscl' if you prefer to test the new feature first)
        window.addEventListener('load', () => {
            renderContent('sscl'); // Loading the new SSCL module initially for testing
            // Ensure the correct link is active on initial load
            document.querySelector('.nav-link-custom[data-section="sscl"]').classList.add('active');
            document.querySelector('.nav-link-custom[data-section="income"]').classList.remove('active'); // Remove initial income active state
        });