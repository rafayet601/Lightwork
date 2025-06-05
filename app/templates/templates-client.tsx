'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle, Save, ClipboardList, PlayCircle, Edit, Copy, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

interface Exercise {
  id: string;
  name: string;
  sets: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
}

export default function TemplatesClient({ templates }: { templates: Template[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const router = useRouter();

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartWorkout = (templateId: string) => {
    // In a real app, this would create a new workout based on the template
    toast({
      title: "Workout Started",
      description: "Created a new workout from template",
    });
    router.push('/dashboard');
  };

  const handleCreateTemplate = () => {
    // In a real app, this would save to the database
    toast({
      title: "Template Created",
      description: "Your workout template has been saved",
    });
    setShowNewTemplateDialog(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text mb-4 sm:mb-0">
          Workout Templates
        </h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="default" 
            className="shadow-lg shadow-primary/20"
            onClick={() => setShowNewTemplateDialog(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </motion.div>
      </motion.div>

      {/* Search Section */}
      <div className="relative mb-8">
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <Card className="h-full flex flex-col border-glow card-hover-effect">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary rounded-md px-2 py-1">
                    {template.exercises.length} Exercises
                  </span>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-grow">
                <div className="space-y-2">
                  {template.exercises.map((exercise) => (
                    <div key={exercise.id} className="flex justify-between items-center text-sm">
                      <span>{exercise.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {exercise.sets} sets
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between">
                <Button variant="ghost" size="sm" className="flex-1 mr-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 ml-1"
                  onClick={() => handleStartWorkout(template.id)}
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Start
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
            <ClipboardList className="h-6 w-6 text-primary/80" />
          </div>
          <h3 className="text-xl font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? "Try adjusting your search term to find what you're looking for." 
              : "Create your first workout template to save time."}
          </p>
          <Button onClick={() => setShowNewTemplateDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workout Template</DialogTitle>
            <DialogDescription>
              Save your workout routine as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="template-name"
                placeholder="e.g., Upper Body Strength"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="template-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="template-description"
                placeholder="e.g., Focus on chest, back, and arms"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Exercises</p>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 