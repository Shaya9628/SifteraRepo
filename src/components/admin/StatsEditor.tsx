import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, BarChart3 } from 'lucide-react';
import { useLandingContent, useUpdateLandingContent, getContentValue } from '@/hooks/useLandingContent';

const StatsEditor = () => {
  const { data: content, isLoading } = useLandingContent('stats');
  const updateContent = useUpdateLandingContent();

  const [stats, setStats] = useState([
    { value: '', label: '', description: '' },
    { value: '', label: '', description: '' },
    { value: '', label: '', description: '' },
    { value: '', label: '', description: '' },
  ]);

  useEffect(() => {
    if (content) {
      setStats([
        {
          value: getContentValue(content, 'stat_1_value', '50%'),
          label: getContentValue(content, 'stat_1_label', 'Time Saved on Training'),
          description: getContentValue(content, 'stat_1_description', 'Reduce onboarding time for new HR hires'),
        },
        {
          value: getContentValue(content, 'stat_2_value', '95%'),
          label: getContentValue(content, 'stat_2_label', 'Screening Accuracy'),
          description: getContentValue(content, 'stat_2_description', 'After completing our training program'),
        },
        {
          value: getContentValue(content, 'stat_3_value', '3x'),
          label: getContentValue(content, 'stat_3_label', 'Faster Onboarding'),
          description: getContentValue(content, 'stat_3_description', 'Get new team members up to speed quickly'),
        },
        {
          value: getContentValue(content, 'stat_4_value', '10K+'),
          label: getContentValue(content, 'stat_4_label', 'Resumes Analyzed'),
          description: getContentValue(content, 'stat_4_description', 'Practice with real-world examples'),
        },
      ]);
    }
  }, [content]);

  const handleStatChange = (index: number, field: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setStats(newStats);
  };

  const handleSave = async () => {
    for (let i = 0; i < stats.length; i++) {
      await updateContent.mutateAsync({ section: 'stats', key: `stat_${i + 1}_value`, value: stats[i].value });
      await updateContent.mutateAsync({ section: 'stats', key: `stat_${i + 1}_label`, value: stats[i].label });
      await updateContent.mutateAsync({ section: 'stats', key: `stat_${i + 1}_description`, value: stats[i].description });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistics Section
          </CardTitle>
          <CardDescription>
            Edit the statistics shown in the stats section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Stat {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`stat-${index}-value`}>Value (e.g., 50%, 10K+)</Label>
                    <Input
                      id={`stat-${index}-value`}
                      value={stat.value}
                      onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                      placeholder="50%"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`stat-${index}-label`}>Label</Label>
                    <Input
                      id={`stat-${index}-label`}
                      value={stat.label}
                      onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                      placeholder="Time Saved"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`stat-${index}-description`}>Description</Label>
                    <Input
                      id={`stat-${index}-description`}
                      value={stat.description}
                      onChange={(e) => handleStatChange(index, 'description', e.target.value)}
                      placeholder="Short description"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateContent.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateContent.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default StatsEditor;
