document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const apiKey = document.getElementById('apiKey').value;
    const environment = document.getElementById('environment').value;
    const files = document.getElementById('files').files;
    const formData = new FormData();

    formData.append('apiKey', apiKey);
    formData.append('environment', environment);
    for (const file of files) {
        formData.append('files', file);
    }

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'result.xlsx';
            link.click();
        } else {
            alert('Failed to upload files');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
