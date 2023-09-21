        // Function to handle "Select All" button click event
        // function handleSelectAllButtonClick() {
        //     const checkboxes = document.querySelectorAll('.checkbox-item');
        //     const areAllChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

        //     // Toggle the checked state of all checkboxes
        //     checkboxes.forEach(checkbox => {
        //         checkbox.checked = !areAllChecked;
        //     });
        //     updateSelectedCount()
        // }
        

        // function handleSelectAllButtonClick() {
        //     const checkboxes = document.querySelectorAll('.checkbox-item');
        //     const areAllChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

        //     // Select only the checkboxes associated with rows that have display: block
        //     const visibleCheckboxes = Array.from(checkboxes).filter((checkbox, index) => {
        //         const row = checkbox.closest('tr'); // Get the parent row
        //         const computedStyle = getComputedStyle(row);
        //         return computedStyle.display === 'block';
        //     });

        //     // Toggle the checked state of visible checkboxes
        //     visibleCheckboxes.forEach(checkbox => {
        //         checkbox.checked = !areAllChecked;
        //     });
         
        // }




        // Attach the handleSelectAllButtonClick function to the "Select All" button click event
        // selectAllButton.addEventListener('click', handleSelectAllButtonClick);