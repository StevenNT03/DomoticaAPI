class SSEPublisher {
    constructor() {
      this.clientsList = [];
      this.eventsHandler = this.eventsHandler.bind(this);
      this.sendEventsToAll = this.sendEventsToAll.bind(this);
    }
  
    eventsHandler(request, response, next) {
      
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',  
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'false' 
      };
      response.writeHead(200, headers);
    
      const data = "connected";
    
      response.write(data);
    
      const clientId = Date.now();
    
      const newClient = {
        id: clientId,
        response
      };
  
      this.clientsList.push(newClient);
    
      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        this.clientsList = this.clientsList.filter(client => client.id !== clientId);
      });
    }
  
    sendEventsToAll(newFact) {
      //this.clientsList.forEach(client => client.response.write('\n'+JSON.stringify(newFact)+'\n'));
      this.clientsList.forEach(client => client.response.write('data:'+JSON.stringify(newFact)));
      this.clientsList.forEach(client => client.response.write('\n\n'));
    }
  }
  
  const publisher = new SSEPublisher();
  
  module.exports = publisher;
  