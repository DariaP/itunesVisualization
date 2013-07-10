function Task(name) {
  this.name = name;
  this.type = 'parseDocument';
}

function UrgentTask(name, client) {
  this.name = name;
  this.client = client;
  this.type = 'parseDocument';
}

function isUrgent(task) {
  return (task.client !== undefined);
}

module.exports = { 
                   Task : Task,
                   UrgentTask : UrgentTask,
                   isUrgent : isUrgent
                 };
