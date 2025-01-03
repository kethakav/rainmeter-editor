import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface ExportModalProps {
  onExport: (metadata: { name: string; author: string; version: string; description: string}, allowScrollResize: boolean) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onExport, open, onOpenChange }) => {
  const [name, setName] = useState('')
  const [author, setAuthor] = useState('')
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [allowScrollResize, setAllowScrollResize] = useState(false)

  const handleExport = async () => {
    const success = await onExport({ name, author, version, description }, allowScrollResize)
    if (success) {
      onOpenChange(false)
      setName('')
      setAuthor('')
      setVersion('')
      setDescription('')
      setAllowScrollResize(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Rainmeter Skin</DialogTitle>
          <DialogDescription>
            Enter metadata for your Rainmeter skin. Click export when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="author" className="text-right">
              Author
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="version" className="text-right">
              Version
            </Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-1" />
            
            <div className='col-span-3'>
              <Checkbox 
                id="allowScrollResize" 
                checked={allowScrollResize}
                onCheckedChange={(checked) => setAllowScrollResize(checked as boolean)}
              />
              <label
                htmlFor="allowScrollResize"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2"
              >
                Allow Mouse Scroll Resize
              </label>
            </div>
            
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal