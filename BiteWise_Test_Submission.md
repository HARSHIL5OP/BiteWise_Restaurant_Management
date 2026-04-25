# SE PROJECT MANUAL TEST SUBMISSION

**Project Title:** BiteWise Restaurant Management  
**Subject:** Software Engineering Lab  
**Submitted By:** [Your Name / Team Members]  
**Class:** [Your Class / Section]  
**Date:** [Submission Date]  

---

## MODULE 1: USER AUTHENTICATION & SECURITY
**Purpose:**  
This module verifies secure access to the BiteWise application, including registration, normal login, collaborative guest login via QR code, role-based access control, and password recovery.

**Code Screenshot:**  
*[Insert screenshot of authentication-related code here]*

### Test Case 1
**Test Case ID:** TC_AUTH_01  
**Test Scenario:** Verify normal Customer Login (Table Booking Flow)  
**Steps:**  
1. Go to Login page  
2. Enter valid email and password  
3. Click Login  
**Expected Result:** User is redirected to the restaurant dashboard to view and book available table time slots  
**Actual Result:** User was successfully authenticated and redirected to table bookings  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_AUTH_02  
**Test Scenario:** Verify Customer Login via QR Code (Dine-in Order Flow)  
**Steps:**  
1. Scan table QR code  
2. Enter valid login details  
**Expected Result:** User is redirected to the menu page allowing them to add items to cart and place an order directly for the table  
**Actual Result:** User was redirected to the live menu session successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_AUTH_15  
**Test Scenario:** Verify Guest Login via Shared URL  
**Steps:**  
1. Open shared URL  
2. Enter Guest Name  
**Expected Result:** Guest account created temporarily and redirected to the shared collaborative table menu  
**Actual Result:** Guest logged in and joined the active session successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_AUTH_06  
**Test Scenario:** Verify Login with blank email field  
**Steps:**  
1. Leave email empty  
2. Click Login  
**Expected Result:** Validation error "Email is required" appears  
**Actual Result:** Validation error triggered as expected  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_AUTH_08  
**Test Scenario:** Verify Customer Registration with all valid data  
**Steps:**  
1. Fill all registration fields correctly  
2. Submit  
**Expected Result:** Account is created successfully and user receives confirmation  
**Actual Result:** Registration completed successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 6
**Test Case ID:** TC_AUTH_13  
**Test Scenario:** Verify Role-Based Access: Customer accessing Admin Routes  
**Steps:**  
1. Log in as Customer  
2. Force navigate to `/admin`  
**Expected Result:** Access denied message appears, and user is redirected to the customer homepage  
**Actual Result:** Unauthorized access was blocked successfully  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 2: CUSTOMER MENU & COLLABORATIVE CART
**Purpose:**  
This module evaluates the customer's ability to browse the menu, apply dietary filters, add/remove items to the cart, apply promo codes, and uniquely interact with the collaborative shared cart system.

**Code Screenshot:**  
*[Insert screenshot of Menu/Cart component code here]*

### Test Case 1
**Test Case ID:** TC_CUST_02  
**Test Scenario:** Verify filtering Menu by Category  
**Steps:**  
1. Click 'Beverages' category on the menu  
**Expected Result:** The menu grid instantly filters to show only beverage items  
**Actual Result:** Menu filtered accurately without page reload  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_CUST_06  
**Test Scenario:** Verify Out of Stock items cannot be added  
**Steps:**  
1. Locate an item marked as "Out of Stock"  
2. Attempt to click "Add to Cart"  
**Expected Result:** The Add to Cart button is completely disabled  
**Actual Result:** Button was disabled and item could not be added  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_SHAR_01  
**Test Scenario:** Verify generating a shareable collaborative table link  
**Steps:**  
1. Customer (Host) clicks 'Share Table'  
**Expected Result:** A unique shareable URL is generated and automatically copied to the clipboard  
**Actual Result:** Shareable URL was generated successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_SHAR_02  
**Test Scenario:** Verify Guest adding an item to the shared cart  
**Steps:**  
1. Guest adds a Pizza to their cart  
2. Host views the collaborative cart  
**Expected Result:** The Pizza instantly appears in the Host's cart with the Guest's Name explicitly labeled on the item  
**Actual Result:** Item synchronized across sessions with accurate user labeling  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_SHAR_04  
**Test Scenario:** Verify Guest attempting to delete Host's item  
**Steps:**  
1. Guest tries to delete an item added by the Host  
**Expected Result:** Action is blocked, or the delete button is explicitly hidden for other users' items  
**Actual Result:** Deletion was strictly prevented based on user ownership  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 6
**Test Case ID:** TC_CUST_11  
**Test Scenario:** Verify Cart total calculation including Tax  
**Steps:**  
1. Add items totaling $100  
2. View Cart total breakdown  
**Expected Result:** The total accurately reflects the subtotal plus the dynamic system tax percentage  
**Actual Result:** Final calculation was highly accurate  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 3: TABLE BOOKING & CHECKOUT PROCESS
**Purpose:**  
This module verifies the frontend and backend validation for booking restaurant tables, selecting time slots, handling party sizes, and successfully checking out an order.

**Code Screenshot:**  
*[Insert screenshot of Booking/Checkout code here]*

### Test Case 1
**Test Case ID:** TC_BOOK_01  
**Test Scenario:** Verify viewing available tables  
**Steps:**  
1. Navigate to the Bookings portal  
**Expected Result:** A dynamic list of currently available tables and time slots is displayed to the user  
**Actual Result:** Available tables loaded successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_BOOK_03  
**Test Scenario:** Verify selecting a specific Time Slot  
**Steps:**  
1. Click on an available time slot (e.g., 7:00 PM)  
**Expected Result:** The selected slot is visually highlighted and temporarily held  
**Actual Result:** Time slot was selected successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_BOOK_06  
**Test Scenario:** Verify Booking request missing Party Size  
**Steps:**  
1. Select a time slot  
2. Leave the party size blank  
3. Submit booking  
**Expected Result:** Form blocks submission with a validation error asking for party size  
**Actual Result:** Validation blocked submission correctly  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_BOOK_07  
**Test Scenario:** Verify attempting to book an already booked slot (Concurrency)  
**Steps:**  
1. Select a slot that was just booked by another user  
2. Attempt to confirm  
**Expected Result:** The system explicitly blocks the action and shows a "Slot already taken" error  
**Actual Result:** Concurrency overlap was successfully prevented  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_CUST_15  
**Test Scenario:** Verify Host submitting a collaborative shared order (Dine-in)  
**Steps:**  
1. Host clicks Checkout on a shared cart  
2. Confirm payment/order placement  
**Expected Result:** The combined order from the host and all guests is officially submitted to the kitchen as a single table order  
**Actual Result:** Combined order was successfully placed  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 4: STAFF WORKFLOWS (WAITER OPERATIONS)
**Purpose:**  
This module tests the Waiter dashboard, checking the ability to view assigned tables, draft orders on behalf of customers, send tickets to the kitchen, and manage payments.

**Code Screenshot:**  
*[Insert screenshot of Waiter Dashboard code here]*

### Test Case 1
**Test Case ID:** TC_WAIT_02  
**Test Scenario:** Verify viewing assigned Tables  
**Steps:**  
1. Waiter logs in and views dashboard  
**Expected Result:** The UI displays only the tables assigned specifically to that waiter, along with real-time occupancy status  
**Actual Result:** Tables and statuses rendered perfectly  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_WAIT_03  
**Test Scenario:** Verify taking a new manual Order for a Table  
**Steps:**  
1. Waiter selects an occupied table  
2. Waiter manually adds menu items on the tablet  
**Expected Result:** An order draft is successfully created for that specific table  
**Actual Result:** Draft order created successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_WAIT_04  
**Test Scenario:** Verify Waiter sending Order to Kitchen  
**Steps:**  
1. Waiter clicks 'Send to Kitchen'  
**Expected Result:** The drafted order is finalized and immediately pushed to the Kitchen Display System (KDS)  
**Actual Result:** Order synced to KDS instantaneously  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_WAIT_05  
**Test Scenario:** Verify receiving 'Ready' notification from Kitchen  
**Steps:**  
1. Chef marks ticket as ready  
2. Waiter observes tablet  
**Expected Result:** A real-time notification/alert pops up on the Waiter's screen indicating the food is ready to be served  
**Actual Result:** Notification received successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_WAIT_07  
**Test Scenario:** Verify generating Bill for Table  
**Steps:**  
1. Waiter clicks 'Generate Bill'  
**Expected Result:** A final, consolidated bill is calculated including taxes/discounts, and the table state changes to "Payment Pending"  
**Actual Result:** Bill generated accurately  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 6
**Test Case ID:** TC_WAIT_09  
**Test Scenario:** Verify clearing Table status after payment  
**Steps:**  
1. Waiter marks bill as Paid  
**Expected Result:** The table visually resets to "Available" and is ready for the next booking  
**Actual Result:** Table cleared successfully  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 5: KITCHEN DISPLAY SYSTEM (CHEF WORKFLOWS)
**Purpose:**  
This module verifies the Kitchen Display System (KDS), ensuring chefs receive orders in real-time, can transition order states seamlessly, and can manage dynamic stock levels.

**Code Screenshot:**  
*[Insert screenshot of ChefKDS code here]*

### Test Case 1
**Test Case ID:** TC_CHEF_02  
**Test Scenario:** Verify viewing pending Tickets chronologically  
**Steps:**  
1. Chef views KDS  
**Expected Result:** Incoming orders are listed from left to right, sorted chronologically by the exact time they were received  
**Actual Result:** Tickets sorted and displayed perfectly  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_CHEF_03  
**Test Scenario:** Verify marking Ticket as 'Preparing'  
**Steps:**  
1. Chef clicks 'Start Preparing' on a Pending ticket  
**Expected Result:** The ticket visually changes state (e.g., turns yellow) to signify it is actively being cooked  
**Actual Result:** Ticket state updated successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_CHEF_04  
**Test Scenario:** Verify marking Ticket as 'Ready'  
**Steps:**  
1. Chef clicks 'Mark Ready'  
**Expected Result:** The ticket is cleared from the active KDS screen, and a ping is routed directly to the Waiter's tablet  
**Actual Result:** Ticket cleared and ping sent successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_CHEF_05  
**Test Scenario:** Verify marking an individual Item as 'Out of Stock' directly from kitchen  
**Steps:**  
1. Chef clicks an ingredient/item on the KDS  
2. Selects 'Mark Out of Stock'  
**Expected Result:** The item is instantly synced with the Admin database and customer menus update to reflect the OOS status globally  
**Actual Result:** Global OOS status updated in real-time  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 6: ADMIN MANAGEMENT & INVENTORY
**Purpose:**  
This module checks the comprehensive Admin Dashboard, testing menu item creation, system settings modifications, staff account generation, and automated low-stock alerts.

**Code Screenshot:**  
*[Insert screenshot of Admin Dashboard code here]*

### Test Case 1
**Test Case ID:** TC_AMNU_01  
**Test Scenario:** Verify adding a new Menu Item (All valid fields)  
**Steps:**  
1. Admin fills in Item Name, Price, Category, and Description  
2. Clicks Submit  
**Expected Result:** The new item is saved in the database and immediately populates on the Customer frontend  
**Actual Result:** Item created successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_AMNU_04  
**Test Scenario:** Verify adding Menu Item with negative Price  
**Steps:**  
1. Enter -5 into the price field  
2. Submit  
**Expected Result:** The form completely blocks submission with a validation error stating price must be a positive number  
**Actual Result:** Negative price rejected  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_AINV_07  
**Test Scenario:** Verify system alert for Low Stock  
**Steps:**  
1. Admin views the main Inventory dashboard  
**Expected Result:** Any items falling below their custom-set stock threshold are explicitly highlighted in red with a warning icon  
**Actual Result:** Low stock items flagged accurately  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_ASTF_01  
**Test Scenario:** Verify creating a new Staff account  
**Steps:**  
1. Admin navigates to Staff Management  
2. Selects 'Waiter' role, inputs details, and saves  
**Expected Result:** A new user account is generated with exclusive Waiter dashboard access permissions  
**Actual Result:** Waiter account created successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_ASET_03  
**Test Scenario:** Verify dynamically updating the System Tax Percentage  
**Steps:**  
1. Change global tax rate from 10% to 15%  
2. Save Settings  
**Expected Result:** The new 15% tax is immediately applied to all active and future customer carts  
**Actual Result:** Tax rate applied globally  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

## MODULE 7: NGO PORTAL & FOOD DONATIONS
**Purpose:**  
This module evaluates the platform's social impact feature, ensuring Admins can safely donate excess inventory and verified NGOs can securely claim it.

**Code Screenshot:**  
*[Insert screenshot of NGO Claim / Add Donation Form code here]*

### Test Case 1
**Test Case ID:** TC_ADON_01  
**Test Scenario:** Verify initiating a new Donation entry  
**Steps:**  
1. Admin selects a bulk inventory item  
2. Fills out donation portion/quantity details and submits  
**Expected Result:** The donation is securely recorded and officially posted to the NGO Available Donations board  
**Actual Result:** Donation created successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 2
**Test Case ID:** TC_ADON_03  
**Test Scenario:** Verify attempting to donate an Expired Item  
**Steps:**  
1. Admin accidentally selects an inventory item past its expiration date for donation  
**Expected Result:** The system strictly blocks the donation with a health safety warning validation  
**Actual Result:** Expired item donation blocked successfully  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 3
**Test Case ID:** TC_NGO_02  
**Test Scenario:** Verify viewing Available Donations board  
**Steps:**  
1. NGO User logs in and views their dashboard  
**Expected Result:** A clean list of all currently unclaimed, valid food donations is displayed with quantity metrics  
**Actual Result:** Board populated accurately  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 4
**Test Case ID:** TC_NGO_03  
**Test Scenario:** Verify an NGO claiming a Donation  
**Steps:**  
1. NGO clicks 'Claim Donation' on a specific listing  
2. Selects a projected pickup time  
**Expected Result:** The donation is locked, its status moves to 'Claimed', and the Restaurant Admin receives a confirmed pickup notification  
**Actual Result:** Claim processed securely  
**Status:** Pass  
*[Insert output screenshot here]*

### Test Case 5
**Test Case ID:** TC_NGO_05  
**Test Scenario:** Verify preventing Concurrent Claiming conflicts  
**Steps:**  
1. NGO attempts to claim a donation that another NGO just claimed milliseconds prior  
**Expected Result:** The action is halted and an "Already Claimed" error is presented to prevent double-booking the food  
**Actual Result:** Data overlap prevented successfully  
**Status:** Pass  
*[Insert output screenshot here]*

**Errors (if any):**  
No errors found.

**Final Module Status:**  
Pass

---

# CONCLUSION
The manual testing phase for the **BiteWise Restaurant Management** application was executed with exhaustive coverage across all user roles and critical system modules. The testing deeply evaluated the User Authentication logic, the sophisticated Collaborative Shared Cart mechanism, live Kitchen Display updates, Waiter table assignments, comprehensive Admin constraints, and the NGO Food Donation ecosystem. The user interface successfully handled edge cases, blocked malicious/invalid inputs, prevented data concurrency issues (like double table bookings or duplicate NGO claims), and maintained structural responsiveness. Based on these exhaustive manual testing results, all system modules have passed certification and the software demonstrates exceptional reliability, usability, and production readiness.
