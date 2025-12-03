       const navLinks = document.querySelectorAll('.nav-link-custom');
        const contentArea = document.getElementById('contentArea');
        const clearButton = document.getElementById('clearBtn');
        const formatter = new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'LKR', 
            minimumFractionDigits: 2 
        });

        // Progressive Monthly Tax Slabs 
        const MONTHLY_TAX_SLABS = [
            { max: 100000, rate: 0.00 }, 
            { max: 141667, rate: 0.06 },
            { max: 183333, rate: 0.12 }, 
            { max: 225000, rate: 0.18 }, 
            { max: 266667, rate: 0.24 }, 
            { max: 308333, rate: 0.30 },
            { max: Infinity, rate: 0.36 } 
        ];

        // --- CALCULATION LOGIC (Payable Tax) ---
        function calculatePayableTax(salary) {
            let taxAmount = 0;
            let taxableIncome = salary;
            let previousMax = 0;
            let appliedRates = new Set();
            let taxBreakdown = [];

            if (taxableIncome <= 100000) {
                appliedRates.add('0%');
            }

            for (const slab of MONTHLY_TAX_SLABS) {
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

            const netSalary = salary - taxAmount;

            return {
                taxAmount: taxAmount,
                netSalary: netSalary,
                appliedRates: Array.from(appliedRates).join(', '),
                breakdown: taxBreakdown
            };
        }

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
                            <h5 class="card-title">Tax Amount [cite: 51]</h5>
                            <div class="result-value" id="taxAmountResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Net Salary [cite: 52]</h5>
                            <div class="result-value" id="netSalaryResult"></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="result-card">
                            <h5 class="card-title">Applied Rate(s) [cite: 50]</h5>
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

        const contentData = {
            payable: getPayableTaxHTML,
            withholding: () => `<h2><i class="fas fa-hand-holding-usd me-2"></i> Withholding Tax</h2><p>This module handles Rent Tax, Bank Interest Tax, and Dividend Tax calculations.</p>`,
            income: () => `<h2><i class="fas fa-calendar-alt me-2"></i> Income Tax (Annual)</h2><p>This module calculates annual progressive tax based on annual income slabs.</p>`,
            sscl: () => `<h2><i class="fas fa-file-invoice-dollar me-2"></i> SSCL Tax</h2><p>This module handles Sale Tax (2.5%) and VAT (15%) calculations.</p>`,
            leasing: () => `<h2><i class="fas fa-car me-2"></i> Leasing Calculations</h2><p>This module calculates Monthly Installments and Max Loan Value using the EMI formula $(A\times i)/(1-(1/(1+i)^{\wedge}n))$[cite: 86].</p>`,
        };

        const renderContent = (section) => {
            const contentFn = contentData[section] || contentData['payable'];
            contentArea.innerHTML = contentFn();
            
            // Re-attach event listeners only for the active section
            if (section === 'payable') {
                attachPayableTaxListeners();
            }
        };

        function attachPayableTaxListeners() {
            const form = document.getElementById('payableTaxForm');
            const salaryInput = document.getElementById('monthlySalary');
            const resultsDiv = document.getElementById('results');
            const feedbackDiv = document.getElementById('salaryFeedback');
            const breakdownBody = document.getElementById('taxBreakdownTableBody');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const salary = parseFloat(salaryInput.value);
                
                // Validation check 
                if (isNaN(salary) || salary <= 0) {
                    salaryInput.classList.add('is-invalid');
                    feedbackDiv.textContent = 'Please enter a valid salary amount (must be a number > 0).';
                    resultsDiv.style.display = 'none';
                    return;
                } else {
                    salaryInput.classList.remove('is-invalid');
                    feedbackDiv.textContent = '';
                }

                const result = calculatePayableTax(salary);
                
                // Display results
                document.getElementById('taxAmountResult').textContent = formatter.format(result.taxAmount);
                document.getElementById('netSalaryResult').textContent = formatter.format(result.netSalary);
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
                     breakdownBody.innerHTML = `<tr><td colspan="4" class="text-center">No tax applied (below Rs. 100,000 threshold).</td></tr>`;
                }

                resultsDiv.style.display = 'block';
            });
            
            form.addEventListener('reset', function() {
                 salaryInput.classList.remove('is-invalid');
                 resultsDiv.style.display = 'none';
                 feedbackDiv.textContent = 'Please enter a valid salary amount (must be a number > 0).';
            });
        }

        // --- NAVIGATION AND INITIAL LOAD LOGIC ---
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                
                navLinks.forEach(l => l.classList.remove('active'));

                if (section === 'clear') {
                    // Reset the form in the currently active module
                    const activeLink = document.querySelector('.nav-link-custom.active');
                    if (activeLink) {
                         const activeSection = activeLink.getAttribute('data-section');
                         if (activeSection === 'payable') {
                            document.getElementById('payableTaxForm').reset();
                            return; 
                         }
                    }
                    alert('Functionality to clear all forms in other modules will be added here.');
                    return;
                }

                this.classList.add('active');
                renderContent(section);
                window.scrollTo(0, 0); // Scroll to top on section change
            });
        });

        // Initial load: render the Payable Tax module
        window.addEventListener('load', () => {
            renderContent('payable');
        });
