'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ExportImportData() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Call the export API endpoint
      const response = await fetch('/api/export');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'workout-data.json';
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your workout data has been exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      setImportStatus('idle');
      setImportMessage('');
      
      // Read the file content
      const fileContent = await file.text();
      let workoutData;
      
      try {
        // Parse JSON data
        workoutData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON file format');
      }
      
      // Send data to import API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import data');
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setImportStatus('success');
      setImportMessage(result.message || 'Data imported successfully');
      
      toast({
        title: "Import Successful",
        description: result.message,
      });
    } catch (error: any) {
      console.error('Error importing data:', error);
      setImportStatus('error');
      setImportMessage(error.message || 'An error occurred while importing data');
      
      toast({
        title: "Import Failed",
        description: error.message || "There was an error importing your data.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export your workout data for backup or import from another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Export Workout Data</h3>
          <p className="text-sm text-muted-foreground">
            Download all your workout data as a JSON file. This can be used for backup or to import to another device.
          </p>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Import Workout Data</h3>
          <p className="text-sm text-muted-foreground">
            Import workout data from a JSON file. This will add the imported workouts to your existing data.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Button 
            onClick={handleImportClick} 
            disabled={isImporting}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
        
        {importStatus !== 'idle' && (
          <Alert variant={importStatus === 'error' ? 'destructive' : 'default'}>
            {importStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {importStatus === 'error' ? 'Import Failed' : 'Import Successful'}
            </AlertTitle>
            <AlertDescription>
              {importMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Note: Importing large datasets may take a few moments. Do not close the page during import.
      </CardFooter>
    </Card>
  );
} 